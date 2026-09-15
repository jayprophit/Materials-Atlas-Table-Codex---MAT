# Preserve exact archive bytes that do not already exist as a committed Git blob.
# This script does not delete files or execute archive material.
$ErrorActionPreference = 'Stop'
$matRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$plan = Get-Content -Raw -LiteralPath (Join-Path $matRoot 'data/quality/archive-recovery-plan.json') | ConvertFrom-Json
$archiveRoot = [IO.Path]::GetFullPath($plan.archive)
$zipPath = Join-Path $matRoot 'archive/source-intake/integration-2026-09-14/original-byte-recovery.zip'
if (Test-Path -LiteralPath $zipPath) { throw 'Recovery ZIP already exists; verify it instead of overwriting.' }
Add-Type -AssemblyName System.IO.Compression
$stream = [IO.File]::Open($zipPath, [IO.FileMode]::CreateNew)
$zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($row in $plan.rows | Where-Object action -eq 'PRESERVE-EXACT-BYTES-BEFORE-REMOVAL') {
        $sourcePath = [IO.Path]::GetFullPath((Join-Path $archiveRoot $row.path))
        if (-not $sourcePath.StartsWith($archiveRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Archive path escape' }
        if ((Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $row.sha256) { throw "Source changed: $($row.path)" }
        $entry = $zip.CreateEntry($row.path, [IO.Compression.CompressionLevel]::Optimal)
        $inputStream = [IO.File]::OpenRead($sourcePath)
        $outputStream = $entry.Open()
        try { $inputStream.CopyTo($outputStream) } finally { $inputStream.Dispose(); $outputStream.Dispose() }
    }
} finally { $zip.Dispose(); $stream.Dispose() }
$readStream = [IO.File]::OpenRead($zipPath)
$check = [IO.Compression.ZipArchive]::new($readStream, [IO.Compression.ZipArchiveMode]::Read)
$verified = 0
try {
    foreach ($row in $plan.rows | Where-Object action -eq 'PRESERVE-EXACT-BYTES-BEFORE-REMOVAL') {
        $entry = $check.GetEntry($row.path)
        if ($null -eq $entry) { throw "Missing ZIP entry: $($row.path)" }
        $entryStream = $entry.Open()
        $sha = [Security.Cryptography.SHA256]::Create()
        try { $digest = [Convert]::ToHexString($sha.ComputeHash($entryStream)).ToLowerInvariant() } finally { $entryStream.Dispose(); $sha.Dispose() }
        if ($digest -ne $row.sha256) { throw "ZIP content mismatch: $($row.path)" }
        $verified++
    }
} finally { $check.Dispose(); $readStream.Dispose() }
[ordered]@{date='2026-09-14'; zip='archive/source-intake/integration-2026-09-14/original-byte-recovery.zip'; sha256=(Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant(); verified_entries=$verified; deletion_performed=$false} | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $matRoot 'data/quality/archive-byte-recovery.json')
Write-Output "Verified $verified exact-byte ZIP entries. No deletion performed."
