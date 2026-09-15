# User-authorised consolidation. Preflight every file against committed recovery before deleting any.
param([Parameter(Mandatory=$true)][string]$RecoveryCommit)
$ErrorActionPreference = 'Stop'
$matRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$plan = Get-Content -Raw -LiteralPath (Join-Path $matRoot 'data/quality/archive-recovery-plan.json') | ConvertFrom-Json
$archiveRoot = [IO.Path]::GetFullPath($plan.archive)
$expectedArchive = [IO.Path]::GetFullPath('C:/Users/jpowe/Desktop/MAT-Integration-Archive')
if ($archiveRoot -ne $expectedArchive -or $archiveRoot -eq $matRoot) { throw 'Unexpected archive target' }
$gitRoot = (& git -C $matRoot rev-parse --show-toplevel).Trim()
if ([IO.Path]::GetFullPath($gitRoot) -ne $matRoot) { throw 'Wrong master Git repository' }
& git -C $matRoot cat-file -e "$RecoveryCommit^{commit}"
if ($LASTEXITCODE -ne 0) { throw 'Recovery commit does not exist' }
$trees = @{}
foreach ($commit in @($plan.comparison_commit, $RecoveryCommit) | Select-Object -Unique) {
    $map = @{}
    foreach ($line in (& git -C $matRoot -c core.quotepath=false ls-tree -r $commit)) {
        if ($line -match '^\d+ blob ([a-f0-9]+)\t(.+)$') { $map[$Matches[2]] = $Matches[1] }
    }
    if ($LASTEXITCODE -ne 0) { throw 'Could not read committed recovery tree' }
    $trees[$commit] = $map
}
$zipRelative = 'archive/source-intake/integration-2026-09-14/original-byte-recovery.zip'
$zipPath = Join-Path $matRoot $zipRelative
$zipBlob = (& git -C $matRoot hash-object --no-filters -- $zipPath).Trim()
if ($zipBlob -ne $trees[$RecoveryCommit][$zipRelative]) { throw 'Recovery ZIP is not committed with identical bytes' }
Add-Type -AssemblyName System.IO.Compression
$zipStream = [IO.File]::OpenRead($zipPath)
$zip = [IO.Compression.ZipArchive]::new($zipStream,[IO.Compression.ZipArchiveMode]::Read)
$approved = [Collections.Generic.List[object]]::new()
try {
    foreach ($row in $plan.rows) {
        if ($row.action -eq 'RETAIN-UNIQUE-LOCAL-MATERIAL') { continue }
        $sourcePath = [IO.Path]::GetFullPath((Join-Path $archiveRoot $row.path))
        if (-not $sourcePath.StartsWith($archiveRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Path escapes archive' }
        $file = Get-Item -LiteralPath $sourcePath
        if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing link target' }
        if ((Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $row.sha256) { throw "Archive changed: $($row.path)" }
        switch ($row.action) {
            'RECOVERABLE-IN-EXISTING-COMMIT' {
                if ($trees[$row.commit][$row.committed_path] -ne $row.git_blob) { throw 'Missing committed original blob' }
                $masterPath = Join-Path $matRoot $row.committed_path
                if (-not (Test-Path -LiteralPath $masterPath)) { throw 'Original counterpart missing from master' }
                # The current counterpart may have later edits; exact original bytes remain in the named commit.
            }
            'COMMIT-IMPORTED-REPORT' {
                $masterPath = Join-Path $matRoot $row.imported_path
                $blob = (& git -C $matRoot hash-object --no-filters -- $masterPath).Trim()
                if ($blob -ne $trees[$RecoveryCommit][$row.imported_path]) { throw 'Report bytes not committed' }
                if ((Get-FileHash -LiteralPath $masterPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $row.sha256) { throw 'Imported report mismatch' }
            }
            'PRESERVE-EXACT-BYTES-BEFORE-REMOVAL' {
                $entry = $zip.GetEntry($row.path)
                if ($null -eq $entry) { throw 'Missing recovery ZIP entry' }
                $entryStream = $entry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
                try { $digest = [Convert]::ToHexString($sha.ComputeHash($entryStream)).ToLowerInvariant() } finally { $entryStream.Dispose(); $sha.Dispose() }
                if ($digest -ne $row.sha256) { throw 'Recovery ZIP bytes mismatch' }
            }
            default { throw 'Unknown recovery action' }
        }
        $approved.Add([ordered]@{path=$row.path; absolute_path=$sourcePath; sha256=$row.sha256; recovery=$row.action})
    }
} finally { $zip.Dispose(); $zipStream.Dispose() }
# All recovery checks have passed. Recheck each original immediately before its non-recursive deletion.
$removed = [Collections.Generic.List[object]]::new()
$receiptPath = Join-Path $matRoot 'data/quality/archive-removal-receipt.json'
try {
    foreach ($row in $approved) {
        if ((Get-FileHash -LiteralPath $row.absolute_path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $row.sha256) { throw 'Archive changed after preflight' }
        Remove-Item -LiteralPath $row.absolute_path
        $removed.Add([ordered]@{path=$row.path; sha256=$row.sha256; recovery=$row.recovery})
    }
} finally {
    [ordered]@{date='2026-09-14'; master=$matRoot; archive=$archiveRoot; recovery_commit=$RecoveryCommit; comparison_commit=$plan.comparison_commit; removed_files=$removed.Count; retained_unique_files=15; private_exclusions=$plan.excluded; complete=($removed.Count -eq $approved.Count); rows=$removed} | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 -LiteralPath $receiptPath
}
# Remove only empty directories, never recursively delete a populated directory.
Get-ChildItem -LiteralPath $archiveRoot -Directory -Recurse | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
    $resolvedDirectory = [IO.Path]::GetFullPath($_.FullName)
    if (-not $resolvedDirectory.StartsWith($archiveRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Directory escapes archive' }
    if (-not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -and -not (Get-ChildItem -LiteralPath $resolvedDirectory -Force | Select-Object -First 1)) { Remove-Item -LiteralPath $resolvedDirectory }
}
Write-Output "Removed $($removed.Count) files after committed recovery checks; retained unique local material and private exclusions."
