# Project: Personalized AI Tutor — Adaptive Learning Platform

## 1. Project Overview

Build a modern, AI-powered personalized tutoring platform that acts as a dedicated private tutor for every student.

The platform must go beyond traditional AI chatbots by understanding each student's knowledge level, learning goals, strengths, weaknesses, common mistakes, learning behavior, and historical progress.

The core mission is:

**"Every student deserves an AI tutor that understands what they know, identifies what they don't know, and continuously adapts to help them learn more effectively."**

The platform should support students across multiple subjects and grade levels, starting with Vietnamese high school mathematics as the initial use case.

Example user request:

"Help me prepare for my Grade 12 final mathematics exam."

Instead of generating generic study advice, the AI Tutor should:

1. Understand the student's learning objective.
2. Identify missing information through minimal, contextual questions.
3. Assess the student's current knowledge.
4. Identify knowledge gaps and misconceptions.
5. Create a personalized study plan.
6. Deliver interactive learning sessions.
7. Evaluate student answers and reasoning.
8. Adapt explanations and exercise difficulty.
9. Track learning progress across sessions.
10. Continuously optimize the learning plan based on actual performance.

The product should feel like a personal tutor who remembers the student, understands their development, and makes intelligent teaching decisions.

---

## 2. Core Product Principles

### Personalization First

Every learning experience must be tailored to the individual student.

Two students asking the same question should receive different learning experiences when their knowledge levels, learning histories, or goals differ.

### Learning Over Answer Generation

The AI should prioritize helping students understand concepts rather than immediately providing final answers.

Use guided questioning, scaffolding, progressive hints, worked examples, and active recall.

### Persistent Student Intelligence

The platform must maintain a structured, persistent student model.

Personalization must not depend exclusively on chat history or conversation context.

### Adaptive Learning

The system should dynamically adjust:

- Learning content
- Exercise difficulty
- Explanation depth
- Hint frequency
- Learning pace
- Review schedules
- Study priorities

### Curriculum Awareness

Learning should follow an organized curriculum with topics, concepts, learning objectives, and prerequisite relationships.

Support integration with curriculum-specific knowledge sources through Retrieval-Augmented Generation (RAG).

### Measurable Learning Outcomes

Success must be measured by demonstrated knowledge improvement, not by the number of AI responses or conversation length.

---

## 3. Target Users

### Primary Users

Students preparing for:

- Daily homework
- School examinations
- Semester final examinations
- National examinations
- Subject-specific assessments
- Long-term academic improvement

### Initial Target

Vietnamese Grade 12 students preparing for mathematics examinations.

### Future Expansion

The architecture should support:

- Multiple grade levels
- Multiple academic subjects
- Different curricula
- University students
- Language learning
- Professional certification preparation
- Lifelong learning

Avoid implementing all expansion scenarios in the initial MVP.

---

## 4. Core System Architecture

Design the platform around the following components.

### A. Student Profile Service

Manage persistent student information:

- Student ID
- Grade level
- Subjects
- Curriculum
- Learning objectives
- Target examination scores
- Examination dates
- Available study time
- Explanation preferences
- Current learning plans

Preferences may be explicitly provided or inferred provisionally from observed behavior.

Do not assume that self-reported preferences necessarily improve learning outcomes.

### B. Student Knowledge Model

Maintain estimated mastery levels for individual concepts.

Example:

```json
{
  "student_id": "student_001",
  "subject": "mathematics",
  "grade": 12,
  "mastery": {
    "derivatives": 0.85,
    "asymptotes": 0.35,
    "vectors": 0.6,
    "statistics": 0.45
  }
}
```

Mastery values represent estimated knowledge, not absolute facts.

Track the evidence, confidence level, and last assessment associated with each estimate.

Support future integration with Bayesian Knowledge Tracing or other knowledge estimation methods.

### C. Student Memory Engine

Implement structured long-term educational memory.

The memory system should track:

- Previously studied concepts
- Correct and incorrect answers
- Repeated misconceptions
- Hint usage
- Learning session summaries
- Demonstrated improvements
- Outstanding weaknesses
- Review history
- Learning objectives

Separate different memory categories:

1. Profile memory
2. Knowledge memory
3. Learning behavior memory
4. Session memory
5. Learning goal memory

Provide appropriate privacy controls, data retention policies, and mechanisms for students to review or correct stored information.

### D. Diagnostic Assessment Engine

Assess student knowledge before generating detailed learning plans.

The engine should:

- Select representative questions.
- Cover relevant prerequisite concepts.
- Adjust difficulty based on responses.
- Identify potential knowledge gaps.
- Detect common misconception patterns.
- Estimate initial concept mastery.
- Avoid unnecessarily long assessments.

A diagnostic assessment should provide sufficient information to recommend an initial learning path.

### E. Personalized Learning Planner

Generate adaptive study plans based on:

- Current mastery
- Target mastery
- Examination date
- Available study time
- Curriculum requirements
- Topic dependencies
- Assessment results
- Learning history

Plans should be continuously updated as new evidence becomes available.

Each learning plan should contain:

- Learning objectives
- Recommended topics
- Daily or session-based activities
- Practice exercises
- Review sessions
- Assessment checkpoints
- Progress indicators

### F. AI Tutoring Engine

Build a conversational tutoring engine capable of teaching interactively.

Support:

- Socratic questioning
- Step-by-step explanations
- Progressive hints
- Worked examples
- Interactive exercises
- Misconception correction
- Concept reinforcement
- Student-controlled explanation depth

Default to guided problem-solving instead of immediately revealing answers.

However, allow direct explanations when pedagogically appropriate or explicitly requested.

The AI should adapt to the student's demonstrated understanding throughout each session.

### G. Assessment and Feedback Engine

Evaluate student responses through:

- Answer correctness
- Mathematical reasoning
- Intermediate solution steps
- Common error patterns
- Attempts required
- Hint dependency
- Performance on independent questions

Use deterministic verification wherever possible, especially for mathematical answers.

Do not rely exclusively on an LLM to determine mathematical correctness.

Provide actionable feedback that explains why an answer is incorrect and what the student should reconsider.

### H. Adaptive Learning Engine

Use student performance to select the next learning action.

Possible actions include:

- Continue current topic
- Increase difficulty
- Reduce difficulty
- Review prerequisite knowledge
- Present a worked example
- Generate additional exercises
- Schedule a review
- Conduct a short assessment
- Move to the next concept

The system must make these decisions using structured learning data rather than relying entirely on unconstrained LLM reasoning.

### I. Curriculum and Knowledge Engine

Represent educational knowledge as structured concepts.

Each concept may contain:

- Concept ID
- Subject
- Grade
- Curriculum
- Chapter
- Lesson
- Learning objectives
- Prerequisites
- Difficulty
- Reference materials
- Related exercises

Create relationships between concepts to support prerequisite-aware learning.

### J. Retrieval-Augmented Generation (RAG)

Design an extensible RAG layer for integrating authorized educational content, including:

- Textbooks
- Curriculum documents
- Teacher-created materials
- Worked examples
- Practice exercises
- Examination preparation materials

Use hybrid retrieval with semantic search, keyword search, and curriculum metadata filtering.

Preserve mathematical notation, source references, and document structure.

RAG should provide grounded educational content, while the personalization engine determines how that content should be taught.

RAG is not the primary objective of the first sprint.

---

## 5. Key User Experience

### Scenario: Grade 12 Mathematics Exam Preparation

**Student:**

"Help me prepare for my Grade 12 final mathematics exam."

**Step 1: Understand the Goal**

The AI asks only essential questions:

- Which semester?
- When is the examination?
- What score are you aiming for?
- Is an official examination outline available?

**Step 2: Initial Diagnostic**

The AI provides a short assessment covering relevant mathematical concepts.

**Step 3: Knowledge Analysis**

The system identifies strong and weak concepts.

**Step 4: Personalized Study Plan**

The AI generates a realistic study schedule based on the student's performance and available preparation time.

**Step 5: Interactive Tutoring**

The student begins a learning session.

The AI explains concepts, asks questions, evaluates responses, and provides hints.

**Step 6: Learning State Update**

The system records performance and updates concept mastery estimates.

**Step 7: Continuous Adaptation**

The learning plan is adjusted based on newly observed strengths and weaknesses.

**Step 8: Progress Review**

The student receives a clear summary of improvements, remaining weaknesses, and recommended next steps.

---

## 6. Main Application Screens

Design a modern, student-friendly interface with the following views.

### Learning Dashboard

Display:

- Personalized greeting
- Current learning goals
- Upcoming examinations
- Today's recommended learning activity
- Learning progress
- Weak concepts
- Recent achievements
- Continue learning action

### AI Tutor Workspace

Provide an interactive learning environment containing:

- Conversational tutoring
- Mathematical formula rendering
- Structured questions
- Answer input
- Hint controls
- Step-by-step feedback
- Current topic
- Session progress

The interface should prioritize learning interactions instead of appearing like a generic chatbot.

### Knowledge Map

Visualize:

- Curriculum structure
- Topic relationships
- Prerequisite concepts
- Estimated mastery
- Completed topics
- Topics requiring review

### Personalized Study Plan

Display:

- Daily learning schedule
- Upcoming lessons
- Learning priorities
- Planned assessments
- Completed activities
- Adaptive adjustments

### Progress Analytics

Track:

- Concept mastery
- Independent answer accuracy
- Misconception recurrence
- Hint dependency
- Assessment performance
- Learning consistency
- Long-term knowledge retention

### Student Profile

Allow students to manage:

- Academic information
- Learning objectives
- Examination targets
- Study availability
- Personalization settings
- Educational memory and privacy preferences

---

## 7. Technical Architecture

Choose a maintainable, modular architecture suitable for rapid MVP development.

Recommended stack:

**Frontend**

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- KaTeX for mathematical notation

**Backend**

- Python FastAPI
- Pydantic
- SQLAlchemy

**Database**

- PostgreSQL
- pgvector for future RAG integration
- Redis when caching or background processing becomes necessary

**AI Layer**

- Provider-independent LLM integration
- Structured outputs
- Tool calling
- Prompt templates
- Model configuration management

**Mathematical Verification**

- SymPy
- Deterministic answer validation
- Mathematical expression normalization

**Observability**

- Structured application logs
- AI request tracing
- Token usage tracking
- AI response evaluation

**Architecture Principles**

- Modular monolith for MVP
- Clear domain boundaries
- Typed APIs
- Database migrations
- Reusable services
- Testable business logic
- Separation between tutoring, assessment, memory, and planning

Avoid premature microservices or unnecessary infrastructure complexity.

---

## 8. Initial Domain Model

Design database entities around:

```text
User
StudentProfile
LearningGoal
Curriculum
Subject
Topic
Concept
ConceptPrerequisite
Question
QuestionAttempt
Assessment
AssessmentResult
StudentMastery
Misconception
LearningPlan
LearningPlanItem
LearningSession
LearningEvent
ReviewSchedule
StudentMemory
KnowledgeDocument
KnowledgeChunk
```

Key relationships:

```text
Student
  ├── LearningGoals
  ├── StudentMastery
  ├── Misconceptions
  ├── LearningSessions
  │     └── QuestionAttempts
  ├── LearningPlans
  └── StudentMemory

Curriculum
  └── Subjects
        └── Topics
              └── Concepts
                    ├── Prerequisites
                    ├── Questions
                    └── KnowledgeChunks
```

The system should support historical learning events so that mastery estimates and learning recommendations can be audited and recalculated.

---

## 9. MVP Scope

Prioritize building one complete personalized learning loop.

### Must Have

1. Student onboarding
2. Learning goal creation
3. Basic curriculum structure
4. Diagnostic assessment
5. Student mastery tracking
6. Persistent learning memory
7. AI tutoring conversations
8. Progressive hints
9. Answer verification
10. Misconception identification
11. Adaptive exercise selection
12. Learning progress dashboard

### Nice to Have

- Personalized study calendars
- Spaced repetition
- Knowledge map visualization
- Examination simulation
- Curriculum-based RAG
- Detailed analytics

### Out of Scope for Initial Sprint

- Voice tutoring
- 3D avatars
- Video course generation
- Teacher marketplace
- Social learning platform
- Multi-agent complexity without demonstrated need
- Full textbook ingestion
- Multiple curricula and subjects
- Fine-tuning custom foundation models

---

## 10. Learning and Personalization Rules

Implement the following behavioral rules:

**Rule 1: Assess Before Assuming**

Never infer a student's knowledge level solely from their grade, self-reported ability, or a single answer.

**Rule 2: Personalize Based on Evidence**

Use demonstrated performance and recorded learning history to inform recommendations.

**Rule 3: Promote Independent Thinking**

Encourage students to reason through problems rather than immediately revealing solutions.

**Rule 4: Detect Misconceptions**

Attempt to distinguish conceptual misunderstandings from simple calculation mistakes.

**Rule 5: Adapt Difficulty**

Increase complexity when students demonstrate stable understanding and reduce complexity when prerequisite gaps emerge.

**Rule 6: Verify Mastery**

A correct answer does not automatically mean a concept has been mastered.

Use repeated, independent assessments when appropriate.

**Rule 7: Maintain Continuity**

Remember relevant learning progress across sessions without requiring students to repeatedly explain their history.

**Rule 8: Be Transparent**

Explain learning recommendations in understandable language.

**Rule 9: Protect Student Data**

Use privacy-conscious defaults, especially when processing data belonging to minors. Minimize stored personal information and provide appropriate access controls.

**Rule 10: Ground Educational Content**

Use verified curricular materials and mathematical validation where possible. Acknowledge uncertainty instead of fabricating facts, textbook citations, or answers.

---

## 11. Evaluation Metrics

Measure educational outcomes rather than general chatbot activity.

Primary metrics:

- Improvement in independent assessment accuracy
- Concept mastery improvement
- Retention of previously learned concepts
- Reduction in repeated misconceptions
- Study plan completion rate

Secondary metrics:

- Diagnostic completion rate
- Learning session completion rate
- Hint dependency
- Student engagement and return rate
- AI response correctness
- Exercise difficulty calibration
- Learning recommendation relevance
- AI operational cost per completed learning session

Use pre-assessment and post-assessment questions that are not identical to the examples shown during tutoring.

---

## 12. Development Strategy

Implement the product incrementally.

### Phase 1: Personalized Learning Foundation

Build:

- Student profiles
- Learning goals
- Structured educational memory
- Basic curriculum data
- Diagnostic assessments
- Concept mastery tracking

### Phase 2: Intelligent Tutoring

Build:

- Conversational tutoring
- Mathematical answer verification
- Progressive hints
- Error diagnosis
- Session persistence
- Adaptive exercise selection

### Phase 3: Learning Planning

Build:

- Personalized study plans
- Adaptive scheduling
- Learning progress visualization
- Review recommendations

### Phase 4: Knowledge Grounding

Integrate:

- Authorized textbook content
- Document ingestion
- Semantic and hybrid retrieval
- Source citations
- Curriculum-aware RAG

### Phase 5: Optimization

Improve:

- Mastery estimation
- Personalization algorithms
- Learning effectiveness
- Cost efficiency
- Scalability
- User experience

---

## 13. Instructions for the AI Development Agent

Act as a senior AI engineer, educational technology architect, product designer, and full-stack developer.

Your responsibility is to design and implement a production-minded MVP of this Personalized AI Tutor platform.

When working on this project:

1. Prioritize a functional end-to-end learning experience.
2. Treat personalization as the central product capability.
3. Separate deterministic educational logic from LLM-generated content.
4. Use structured data models and well-defined APIs.
5. Make architectural decisions based on simplicity, testability, and extensibility.
6. Build real functionality rather than decorative prototypes.
7. Implement persistent student learning state.
8. Ensure mathematical correctness whenever possible.
9. Design a polished, intuitive, responsive user experience.
10. Avoid unnecessary features that do not contribute to measurable learning outcomes.
11. Include realistic sample data for Vietnamese Grade 12 mathematics.
12. Support Vietnamese as the default student-facing language, while keeping the system architecture internationalization-ready.
13. Explain major architecture decisions and their trade-offs.
14. Implement error handling, validation, logging, and automated tests for critical paths.
15. Never claim that the system has measured learning improvement without actual evaluation data.

Before implementation, define:

- Product scope
- System architecture
- Database schema
- AI orchestration flow
- Student memory strategy
- Personalization decision logic
- API contracts
- Frontend screen architecture
- Sprint backlog
- Acceptance criteria

Then implement the first complete vertical slice:

**Student onboarding → Learning goal → Diagnostic assessment → Personalized tutoring → Answer evaluation → Mastery update → Next learning recommendation.**

Use this vertical slice as the foundation for the entire platform.

---

## 14. Definition of Done

The initial MVP is successful when a student can:

1. Create a learning profile.
2. Enter a goal such as "Help me prepare for my Grade 12 mathematics final exam."
3. Complete a short diagnostic assessment.
4. Receive a personalized recommendation based on actual answers.
5. Start an interactive tutoring session.
6. Receive adaptive hints and educational feedback.
7. Complete exercises whose answers are validated.
8. Have their learning performance saved persistently.
9. Return in a later session and continue learning from their previous progress.
10. Observe meaningful changes in learning recommendations based on their performance.

**Final Product Vision**

Build an AI tutor that does not merely remember conversations.

Build an AI tutor that understands the student's evolving knowledge, identifies what they need next, and continuously adapts its teaching strategy to help them become independent learners.
