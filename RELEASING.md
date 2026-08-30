<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# Releasing

A release is a **signed tag**, not a merge. `main` moving is not a release, and the
version string in the tree names the requirement set rather than the release — see
`spec/00-status.md`.

`v0.2.0-draft` is tagged on **2026-11-30**, when the RFC period closes and every comment
has a published disposition.

## Before tagging

```sh
./tools/check-all.sh                                     # all 16, zero failures
node tools/gen-requirement-diff.mjs v0.1.0-draft         # every text change classified
node tools/bpi-validate.mjs claim ../BeamDesk/bpi-conformance.json
```

`CLAUDE.md` in the BeamDesk repository carries the version-bump checklist. It exists
because the 0.1 → 0.2 bump was declared complete three times and was not.

## Tagging

Tags are signed with SSH, and the public half is committed to
[`conformance/keys/allowed-signers`](conformance/keys/allowed-signers) so a tag can be
verified without trusting anyone's badge:

```sh
git tag -s v0.2.0-draft -m "BPI 0.2.0-draft — RFC period closed"
git push origin v0.2.0-draft

# and to check it, from a fresh clone:
git config gpg.ssh.allowedSignersFile conformance/keys/allowed-signers
git tag -v v0.2.0-draft          # Good "git" signature for ido@jacob-ai.com
```

`tag.gpgsign` is set in the repository's own config, so `git tag` signs by default and an
unsigned release tag has to be produced deliberately.

**That key is not the test key.** `conformance/keys/test-key.pem` signs the conformance
vectors and its private half is published on purpose, so it proves nothing about
authorship. These are two different jobs and conflating them would make both useless.

For the **Verified** badge on GitHub the same public key must also be registered at
*Settings → SSH and GPG keys* as a **Signing Key** — a separate entry from the
authentication key, even when the key material is identical. Nothing breaks without it;
`git tag -v` still verifies against the committed allowed-signers file, which is the
check that does not depend on a third party.

## Check §8.4's links resolve, anonymously

Not automated on purpose: `check-all.sh` runs offline and with no committed dependencies,
and making the build depend on the network would trade a real property for a small one. So
before tagging, fetch every claim-document URL in §8.4 **logged out**:

```sh
curl -s -o /dev/null -w '%{http_code}\n' -L <each §8.4 link>
```

The author's own row failed this on 2026-08-30: it pointed into a private repository and
returned 404 to everyone but its owner, which meant the only published conformance claim in
existence was not published.

## DOI

`CITATION.cff` and `.zenodo.json` are in place. A DOI matters more here than any other
form of reach: `OBJECTIONS.md` O-3 is that nobody asked for this, and one citation in a
paper or a procurement document answers it better than any amount of traffic.

**The GitHub↔Zenodo integration will probably not work.** It is an OAuth app
authorisation, and the account that owns this organisation is flagged and cannot
authorise third-party applications — the same block that stops Cloud Build triggers
firing on the BeamDesk repository.

The manual path does not need it and takes ten minutes:

1. `git archive --format=tar.gz --prefix=bpi-0.2.0-draft/ -o bpi-0.2.0-draft.tar.gz v0.2.0-draft`
2. Upload at <https://zenodo.org/uploads/new>, signed in with ORCID or email rather than GitHub
3. Paste the fields from `.zenodo.json`; Zenodo also reads `CITATION.cff` from the archive
4. Reserve the DOI **before** publishing, put it in the README badge and in `CITATION.cff`
   as `doi:`, commit that, and re-upload — so the archived copy carries its own identifier
5. Publish. Zenodo mints a *concept* DOI covering all versions and a version DOI for this
   one; cite the concept DOI in prose and the version DOI in the changelog

If the account flag is ever lifted, the GitHub integration automates steps 1–5 on every
release, and one support appeal unblocks Cloud Build triggers and Projects as well.
