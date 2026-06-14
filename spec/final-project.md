# Final Project Spec

此 spec 為去年 CSU0021 電腦圖學的，僅供參考

CSU0021: Computer Graphics

## Overview

In this final project, you will design and implement an interactive 3D game that demonstrates the computer graphics techniques you have learned this semester. Your game should integrate multiple 3D objects in a coherent scene, allow the user to play with a clear goal in mind, and showcase your own aesthetic and design decisions. Audio (sound effects and/or background music) is encouraged — a game with thoughtful audio will be rated more favorably under the Design Document (Creativity & Aesthetics) component below.

What counts as a "game"? Your work should function as a game — the player has a goal, can act toward it, and can succeed or fail. The Game Mechanics section below breaks "game mechanics" into six concrete dimensions and explains how each contributes to your score. A submission where the user can walk around but nothing happens (no goal, no interaction, no end-state) is not a game and will lose substantial points in both Game Mechanics and Design Document (Creativity & Aesthetics).

> **Note.** You are not allowed to use any high-level 3D rendering library, such as three.js.

## Grading Rubric

Your final score is composed of five parts:

| Component | Weight |
|---|---|
| 1. Technical Implementation | 25% |
| 2. Game Mechanics | 25% |
| 3. Design Document (Creativity & Aesthetics) | 20% |
| 4. Presentation (Demonstration Video) | 15% |
| 5. Peer Comments | 15% |
| **Total** | **100%** |

### 1. Technical Implementation (25%)

Your game must include the following required user interaction:

- One of the 3D objects is the "player". Users can move and rotate the player using the mouse and keyboard.
- Meaningful camera control that demonstrates your understanding of camera transformations (see "Camera Control" below).

**Camera Control.** The default expectation is:

- A first-person view that moves and rotates with the player.
- A third-person view (fixed or following) that the user can switch to. The third-person view can be a fixed camera position that covers most of the scene.

If your game type does not fit a first/third-person setup, you may propose an alternative camera design of at least equivalent complexity. Acceptable alternatives include:

- Smooth follow camera with adjustable distance and angle (e.g., key-controlled zoom and orbit).
- Multiple cinematic camera angles triggered by gameplay events.
- Top-down view with a zoom-in view that the user can switch between.
- Picture-in-picture (e.g., main view plus a mini-map second viewport).
- Cutscene-style camera transitions triggered by gameplay events.

A single fixed camera does not satisfy this requirement. If you choose an alternative camera design, you must explain your design choice and reasoning in the design document.

Your game must implement the following graphics techniques:

- One point light source with local illumination (ambient + diffuse + specular, using Phong shading).
- At least one 3D object with nice texture mapping.
- An environment cube map (skybox) as the scene background.
- Cube map reflection or refraction on at least one object.

**Pick 2 out of 3:**

- shadow
- dynamic reflection
- bump mapping

> **Note on reflection.** If you implement dynamic reflection from the picks above, it also satisfies the "cube map reflection or refraction" requirement in the graphics techniques list — you do not need a separate static reflection object.

Game mechanics is graded separately — see Section 2 below.

### 2. Game Mechanics (25%)

Your game's playability and interaction design is evaluated along the six dimensions listed below. You do not have to implement all six — but the more you implement, the more credit you receive for this component.

- **D1. Clear Objective.** The player understands what they are trying to do and what counts as "winning". Examples: collect N items, reach a goal location, survive for N seconds, achieve a target score.
- **D2. Collision / Interaction Detection.** The player and the game objects interact meaningfully through collision or contact. Examples: player picks up items on contact, obstacles block movement, projectiles hit targets, player loses on hitting a hazard.
- **D3. Scoring or Progress Tracking.** The player can perceive their own progress in the game. The score or progress indicator must be visible on screen during gameplay. Examples: visible score counter, item count, progress bar, remaining time, level indicator.
- **D4. Win / Lose State.** The game ends and the outcome is clearly communicated. Examples: a "You Win" screen, a "Game Over" message, a clear pause + option to restart.
- **D5. Game Feedback.** The player receives clear in-game feedback when events happen (not just console.log). The feedback must actually fire when the corresponding event occurs during gameplay. Examples: a chime when collecting an item, a screen flash on damage, a UI animation when score updates, a brief particle or color effect on collision.
- **D6. In-game Instructions.** The webpage includes clear, visible guidance for a player who has never seen your game before. This must explain at least: the objective, how to control the player, what counts as winning, and what counts as losing. The guidance can be a panel on the page (e.g., at the bottom of the page), an opening title screen, an in-game tutorial overlay, or a pause/help screen — but it must be visible to the player without reading any code or documentation.

Each dimension must actually be exercised during normal gameplay; a feature that exists only in code but never triggers does not count.

**Scoring scale:**

| Dimensions implemented | Credit for this component (out of 25%) |
|---|---|
| 5 or 6 | 100% |
| 4 | 80% |
| 3 | 60% |
| 2 | 40% |
| 1 | 20% |
| 0 | 0% |

### 3. Design Document (Creativity & Aesthetics) (20%)

This component grades both your design document AND the creative quality of your finished game. The design document is where you make your design decisions explicit; the game is where those decisions are realized. We evaluate them together.

**What to submit.** A 2–5 page PDF. The first page must include the following header information:

- Student ID
- Department (your main major, if you are double-majoring)
- Year
- Name
- A screenshot of your game

The rest of the PDF explains the decisions behind your project. A strong design document is not a feature checklist — it is a record of your design thinking. Address at least the following four areas:

- **Game concept.** What is your game? What is the goal? What experience do you want the player to have?
- **Scene & visual design.** Why this setting? Why these objects? What is your visual style trying to convey?
- **Technical choices.** For each major technique and parameter you used, briefly justify the choice.
- **Challenges and solutions.** What did you get stuck on? What did you try? How did you fix it? Both technical and design challenges count.

Every parameter you set must be a deliberate, defensible choice. The questions below are not optional examples — answer the ones that apply to your implementation, at the level of specificity the questions suggest. If a question does not apply to your project (e.g., you did not implement refraction), skip it. Otherwise, address it.

Reasoning must match what the technique actually does. Your explanation for each parameter must align with what the parameter actually controls. For example: "I set the specular coefficient high so the surface looks more colorful" is technically incorrect — specular controls how sharply a surface reflects direct light toward the viewer, not its base color. Even if the choice happened to look good, this kind of explanation will lose points because it betrays a misunderstanding of the underlying technique. Explanations are graded on both design intent and technical accuracy.

**Visual & scene design (high-level) — how visuals connect to your game:**

- Why did you choose this overall setting (underwater, space, dungeon, room, forest, . . . )? How does it support your game's concept and the experience you want the player to have?
- Why this color palette and visual mood? How does it reinforce the feel of the game?
- Why are these particular 3D objects in the scene? What role does each play in the game or the atmosphere?

**Camera & projection:**

- Why is the camera positioned where it is? (For first-person: at the player's head? offset? at what height?)
- Why this canvas size or aspect ratio?
- Why these perspective-projection parameters: the FOV, the aspect ratio, the near and far clipping planes? What look or constraint drove these choices?

**Lighting — the light itself:**

- Why this light color? What mood or setting does it support?
- Why one light? (Or why two? Why this number?)
- Why is the light placed at this specific position in the scene? What would change if it were on the other side?

**Phong material per object:**

For each major object (the player, key obstacles, the reflective object, important textured surfaces, etc.), justify the material parameters you chose:

- The ambient coefficient and the ambient color.
- The diffuse coefficient.
- The specular color and the specular coefficient.
- The shininess.

Brief reasoning is acceptable for minor decorative objects, but for the player and any object the player interacts with, give specific reasoning. Remember the technical-accuracy requirement above.

**3D models:**

- Why did you pick this specific 3D model for the player? For each major obstacle, enemy, or collectible?
- What does each model contribute to the game's feel or gameplay?

**Textures:**

- Why this texture on this surface? What look or function does it support?
- Why this specific environment / skybox texture? How does it fit the setting of your game?
- If any of your objects use a plain solid color (e.g., fully red, fully yellow) rather than a texture, why? Is this an intentional choice for your game's visual style, or simply because you did not find a fitting texture?

**Optional techniques you implemented:**

- Refraction (if implemented): why these refraction parameters? What did you tune toward?
- Shadow (if implemented): how did you choose the shadow color and the blend parameter that combines the shadow with the surface's underlying color?

**Flexibility, but with reasoning.** You have wide flexibility in your design choices — but you must be able to explain them. Below is the same decision written two ways. We are looking for the second style.

Weak (do not write this):

> "I placed the light above the player. I used a diffuse coefficient of 0.8."

Strong:

> "I placed the point light above and slightly behind the player so that objects directly in front of the player are lit but cast a long shadow forward. This was a deliberate choice for the adventure feel of my game: the forward-cast shadow telegraphs upcoming obstacles a moment before the player reaches them. I raised the diffuse coefficient from the default 0.5 to 0.8 because my underwater textures looked washed-out at 0.5, and 0.8 brought back enough color saturation without making the specular highlights blow out."

The strong version is not longer just for the sake of being longer — every parameter is tied to an intent (adventure feel, telegraphing obstacles, underwater color saturation). That is what we are grading.

> **Warning.** If your scene or your game concept is too close to what we have seen in class examples or quizzes, this component will receive a low score. Re-skinning a class example with new textures is not originality.

### 4. Presentation — Demonstration Video (15%)

Every student submits a demonstration video of their game.

The video should be approximately 4–6 minutes long, narrated in English (this is an EMI course) using your own voice (please do not use AI-generated voice / TTS). If you are not confident in your English, it is fine to write out a script in advance and read from it — the requirement is that the voice is yours. Submit the video to Moodle.

No in-person demonstration this year, and no class on June 11.

The video should begin with a brief introduction in which you state your name, student ID, department, and year. After that, cover:

1. What the game is and roughly what the player does. A brief overview of the concept and the goal.
2. Actual gameplay. Play your game on screen. Especially showcase any unique or interesting design elements you put effort into.
3. Your most proud design choice, and a closing remark. Talk about what you are most proud of in your project, then wrap up.

The video adds value by showing the game in motion — so spend most of your time on actual gameplay rather than reading your design document or showing code (those are submitted separately).

### 5. Peer Comments (15%)

This component is a post-submission activity. After all videos are submitted, each student will be assigned 5 randomly-selected peer videos to watch and comment on. Logistics (where to view videos, where to submit comments) will be announced after the deadline.

What counts as a thoughtful comment? Each comment should be 50–150 words and must include at least two of the following four elements:

1. A specific observation about something concrete in the video or the game — a gameplay moment, a visual choice, a technical implementation you noticed.
2. Your interpretation — why you think it works well, or why it does not quite work.
3. A constructive suggestion or alternative the creator could have tried.
4. A general comment or conclusion about the project as a whole.

**Examples.**

Not thoughtful (will not earn credit):

- "Great game! Nice work."
- "Cool design."
- "I really liked it, very impressive."

Thoughtful:

> "The warm orange skybox against the cool blue water created strong color contrast that made the floating coins really stand out. At around 2:30 the player's shadow stretched out very long — I wondered whether this was intentional for telegraphing movement direction, or a side effect of where the light was placed. In my own project I kept the light directly overhead to avoid that, but your version feels more dynamic and adventurous because of it."

This comment satisfies #1 (specific observation about color contrast), #2 (interpretation of the long shadow), and #4 (overall conclusion: "your version feels more dynamic and adventurous").

**Scoring scale.** Each of the 5 assigned comments is graded individually as pass / fail using the rubric above. Each comment that passes is worth 3% of your final grade.

| Thoughtful comments | Credit for this component (out of 15%) |
|---|---|
| 5 | 15% |
| 4 | 12% |
| 3 | 9% |
| 2 | 6% |
| 1 | 3% |
| 0 | 0% |
