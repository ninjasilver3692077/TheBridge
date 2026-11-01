# Spec Delta

## Purpose

Defines the decorative background of the Home hero: which images it shows, how it rotates them, and what it shows when images are unavailable.

## ADDED Requirements

### Requirement: Hero rotates library photographs
The Home hero background SHALL show three library photographs, one at a time, advancing to the next every 7 seconds with a cross-fade and a position indicator. The background SHALL be hidden from assistive technology.

#### Scenario: Automatic rotation
- **WHEN** a user stays on the Home page for more than 7 seconds
- **THEN** the background cross-fades to the next photograph and the indicator marks its position

#### Scenario: Decorative only
- **WHEN** a screen reader user reaches the Home hero
- **THEN** the background images and the indicator are not announced

### Requirement: Hero respects reduced motion
When the user's system requests reduced motion, the hero SHALL show a single photograph and SHALL NOT rotate or animate.

#### Scenario: Reduced motion enabled
- **WHEN** a user with reduced motion enabled opens the Home page
- **THEN** one photograph is shown and it never changes while the page is open

### Requirement: Hero falls back when images fail
A photograph that fails to load SHALL be dropped from the rotation. When no photograph loads, the hero SHALL show the cover wall instead.

#### Scenario: One image missing
- **WHEN** one of the three photographs fails to load
- **THEN** the hero rotates between the remaining two and the indicator shows two positions

#### Scenario: All images missing
- **WHEN** none of the photographs load
- **THEN** the hero shows the cover wall and no indicator
