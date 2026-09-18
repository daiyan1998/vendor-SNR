# No password; phone + OTP is the sole credential

Vendors Hub authenticates every User by phone + OTP alone — there is no password anywhere in the product, for either Registration or Login. This trades the familiarity of a password fallback for a smaller attack surface (no password storage, hashing, or breach-reuse risk) and a single credential-loss story to design for: losing access to the registered phone number, rather than two independent ones (forgotten password vs. lost phone).

**Consequence**: account recovery is entirely dependent on regaining control of the registered phone number (e.g., via the carrier). Vendors Hub has no way to authenticate someone who has permanently lost that number without a manual, out-of-band identity-verification fallback.
