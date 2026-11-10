---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. 

If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before – use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from.

Build with the brief's real content and subject matter throughout.

## Design principles

- **For web designs, the hero is a thesis.** Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.
- **Typography carries the personality of the page.** Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.
- **Structure is information.** Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence.
- **Motion with purpose.** Animations should explain state changes or guide the eye to what matters, never move just to feel busy. Respect reduced-motion preferences.
- **Handle complexity by subtraction.** Let one element be the memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief.
- **Build to a quality floor without announcing it:** responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes.

## Words are design

Write interface copy as if a human copywriter spent a day on it.
- **Buttons and actions:** Say what will happen ("Save changes", "Create repository", "Send reset link"). Never use generic lazy labels like "Submit" or "Proceed".
- **Errors:** Never apologize. Never be vague. Say what went wrong and what the user can do about it ("Username must be at least 3 characters", not "An error occurred").
- **Empty states:** Tell the user what belongs here and give them a direct path to put it there.
- **Labels and helper text:** Keep helper text brief and functional. Avoid ALL CAPS for section labels unless it serves a specific typographic rhythm.
