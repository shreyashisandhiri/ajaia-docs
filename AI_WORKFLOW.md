# AI-native development workflow

## Tools used
- **ChatGPT (GPT-6):** assisted with requirements decomposition, scope selection, code generation, documentation, and test scaffolding.
- **Node.js built-in test runner:** executed automated verification locally.
- **Chromium (headless):** used to capture a visual preview when available.

## Where AI accelerated work
AI helped translate the broad assignment into a small, complete product slice, generate consistent UI and API code, and draft setup and architecture documentation within the timebox.

## Human review / changes to record before submission
The project owner should review and adapt the generated implementation, especially the identity model, access checks, editor behavior, and deployment tradeoffs. **Do not claim personal changes or rejected suggestions that you did not make.** Add actual examples after reviewing the code, e.g. a change to error handling, a rejected dependency, or a UX issue fixed during testing.

## Verification actually performed
- `npm test`: three access-control tests passed during development.
- Local HTTP smoke test: homepage returned HTTP 200 and document-list API responded.
- Any additional deployment and browser walkthrough verification should be recorded here after it is completed.

## Judgment and limitations
The key scope choice was to favor local reliability and testability over complex real-time collaboration. AI-generated code was not assumed to be production-ready; limitations around demo authentication, HTML handling, editor commands, and filesystem persistence are disclosed in the README.
