# Project Instructions for GitHub Copilot

This document provides project-level context, conventions, and constraints for Copilot when working in this repository.

---

## 1. Tech Stack

> This part has been migrated to `.github/instructions/1-tech-stack` and should be read as needed.

## 2. General Naming Conventions

> This part has been migrated to `.github/instructions/2-general-naming-conventions` and should be read as needed.

## 3. Project Structural Constraints

> This part has been migrated to `.github/instructions/3-project-structural-constraints` and should be read as needed.

## 4. Feature Reference

> This part has been migrated to `.github/instructions/4-feature-references` and should be read as needed.

---

## 5. Response Conventions for Copilot

When generating responses for this project, Copilot should:

1. **Think in English**: Internal reasoning and analysis should be in English.
2. **Respond using the language that the user is using**: For example, if the user is conversing in Chinese, responses should be in Chinese.
3. **Write code / docs / commit messages in English (United States)**: All code, comments, documentation, commit messages should be in English (United States). When writing, use standard ASCII characters as much as possible, like: using `-` instead of `-`, using `->` instead of `→`.
4. **Discuss before executing**: When the user proposes a new function or a change, first explain the approach and analysis. Only proceed with implementation after the user confirms ("go ahead", "执行", "可以", etc.).
5. **Priority of norms/standards**: If there are more normative or standard practices, priority should be given to norms or standards, even if refactoring is required.
6. **Conventions of Commit Messages**:
    - Write in English (United States).
    - Use the simple present tense to describe changes. e.g. "Change" is **correct**; "Changed" is **wrong**.
    - The whole commit message should be as short as possible.
    - First provide a summary, then list the 1-4 main changes; minor changes can be ignored.
    - Basic example format:
    ```
    Summary
    - Major Change 1
    - Major Change 2
    - Major Change 3
    ```
