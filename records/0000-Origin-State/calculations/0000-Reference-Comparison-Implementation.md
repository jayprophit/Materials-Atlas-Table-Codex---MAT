# Typed reference comparison implementation

This calculation implements the reference-difference and normalisation definitions in the [Origin State](../0000-Origin-State.md), sections 4–5 and 28–30. The reusable implementation is [reference-metrics.mjs](../../../scripts/reference-metrics.mjs).

For the same property expressed in the same canonical unit:

\[
\Delta q=q-q_{\mathrm{ref}},\qquad
u^2(\Delta q)=u^2(q)+u^2(q_{\mathrm{ref}})-2\operatorname{cov}(q,q_{\mathrm{ref}}).
\]

Input uncertainties must use compatible uncertainty conventions. Covariance is supplied explicitly; omitted covariance leaves output uncertainty unknown. Incompatible units, missing values and impossible covariance are rejected. Automatic unit conversion is not performed.

With a positive, exact-by-definition scale in the same unit:

\[
z_q=\frac{q-q_{\mathrm{ref}}}{s_q},\qquad u(z_q)=\frac{u(\Delta q)}{s_q}.
\]

An uncertain scale is rejected because its uncertainty and cross-covariances require a more complete model. This coordinate is dimensionless. It does not define a universal distance between materials.

The algorithm requires property, unit and state identifiers. Scientific users must additionally establish compatible physical states and reference conditions; software type checks cannot decide that two experiments are comparable. The output is a calculated comparison, not a newly measured property or evidence for Causali E predictions.

Verification includes correlated inputs, missing covariance, zero/null separation, incompatible units, invalid covariance and an uncertain scale. Test numbers are software fixtures, not measurements of any element.
