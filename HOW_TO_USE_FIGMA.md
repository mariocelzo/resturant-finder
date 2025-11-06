# How to Use Figma MCP with Claude Code

## Overview

The Figma MCP (Model Context Protocol) integration allows Claude Code to directly interact with your Figma designs. This enables seamless conversion of Figma designs into production-ready code that matches your existing codebase style and architecture.

## Prerequisites

- Figma Desktop App installed and running
- Figma MCP connection established (you should see "Connected to figma" message)
- Access to your Figma design files

## Available Capabilities

### 1. Generate Code from Figma Designs

**What it does**: Converts Figma components and screens directly into React Native/TypeScript code that matches your project structure.

**When to use**:
- Creating new screens from Figma mockups
- Implementing new UI components
- Ensuring pixel-perfect implementation of designs

**How to use**:
- Provide a Figma URL like: `https://figma.com/design/[fileKey]/[fileName]?node-id=1-2`
- Or open the design in Figma Desktop and ask Claude to work with the selected node
- Claude will extract the code and assets automatically

**Example requests**:
- "Convert this Figma screen to a React Native component: [Figma URL]"
- "Generate code for the selected Figma component"
- "Implement this design following our project conventions: [Figma URL]"

### 2. Take Screenshots of Designs

**What it does**: Captures visual snapshots of Figma components/screens for reference and discussion.

**When to use**:
- Discussing design details with Claude
- Visual reference while coding
- Comparing implemented UI with designs

**How to use**:
- Provide the Figma URL with the specific node
- Claude can screenshot specific components or entire screens

**Example requests**:
- "Show me a screenshot of this Figma component: [URL]"
- "Take a screenshot of the restaurant card design so we can discuss it"

### 3. Get Design Metadata

**What it does**: Retrieves structural information about Figma designs (layer hierarchy, node IDs, positions, sizes).

**When to use**:
- Understanding complex design structures
- Finding specific components within a large design file
- Getting an overview of a design's organization

**Example requests**:
- "What components are in this Figma page?"
- "Show me the structure of this design file"

### 4. Create Design System Rules

**What it does**: Analyzes your Figma designs and generates design system documentation and rules.

**When to use**:
- Setting up design system conventions
- Documenting design patterns
- Ensuring consistency across the codebase

**Example requests**:
- "Create design system rules based on our Figma designs"
- "Generate a style guide from our Figma components"

## Best Practices for This Project

### Getting Component Code

When requesting code from Figma for NearBite:

1. **Provide Clear Context**:
   ```
   "Convert this Figma restaurant card design to match our existing
   RestaurantCard component style: [Figma URL]"
   ```

2. **Specify the Framework**:
   ```
   "Generate React Native code (TypeScript) for this screen: [Figma URL]"
   ```

3. **Reference Existing Patterns**:
   ```
   "Implement this Figma design following the patterns in
   src/components/Card.tsx: [Figma URL]"
   ```

### Working with Screens

When implementing entire screens:

1. **Break Down Complex Screens**:
   ```
   "Let's implement this screen in parts. First, show me the header
   section from this design: [Figma URL]"
   ```

2. **Request Style Extraction**:
   ```
   "Extract the color scheme and typography from this Figma design: [URL]"
   ```

3. **Component Reuse**:
   ```
   "Generate code for this design, reusing our existing Button and
   Card components where possible: [Figma URL]"
   ```

## Workflow Example

Here's a complete workflow for implementing a new feature from Figma:

1. **Share the Design**:
   ```
   "I want to implement this new favorites screen from Figma:
   https://figma.com/design/abc123/NearBite?node-id=45-67"
   ```

2. **Review Generated Code**:
   Claude will generate code matching your project structure and conventions.

3. **Request Adjustments**:
   ```
   "Update the spacing to match our theme constants in src/styles/theme.ts"
   ```

4. **Extract Assets**:
   Claude will provide download URLs for any icons, images, or assets from the design.

5. **Integration**:
   ```
   "Now integrate this with our navigation and add it to the Profile tab"
   ```

## Tips for Best Results

1. **Be Specific with Node Selection**:
   - Select the exact component/frame in Figma before asking Claude
   - Use node-id URLs for precise targeting

2. **Reference Existing Code**:
   - Always mention relevant existing components or patterns
   - Example: "Use our existing theme colors from src/styles/theme.ts"

3. **Iterative Refinement**:
   - Start with basic structure, then refine
   - Request specific adjustments rather than complete rewrites

4. **Asset Management**:
   - Ask Claude to save assets to appropriate directories
   - Example: "Save the icons to src/assets/icons/"

5. **Style Consistency**:
   - Reference CLAUDE.md conventions
   - Mention specific style requirements (spacing, colors, typography)

## Common Use Cases

### Creating a New Screen
```
"Implement the RestaurantListScreen from this Figma design: [URL]
- Use our existing RestaurantCard component
- Match the layout and spacing from the design
- Integrate with our navigation (RootStackParamList)
- Follow our service layer pattern for data fetching"
```

### Updating an Existing Component
```
"Update our FavoriteButton component to match this new design: [URL]
Keep the existing functionality, just update the visual styling"
```

### Building a New Component
```
"Create a new RatingStars component based on this Figma design: [URL]
- Make it reusable and accept rating as a prop
- Match our project's TypeScript conventions
- Add it to src/components/"
```

### Implementing Design System Changes
```
"Our designer updated the color palette in Figma: [URL]
Update src/styles/theme.ts to match the new colors"
```

## Troubleshooting

**Issue**: Claude can't access the Figma design
- **Solution**: Make sure Figma Desktop is running and you're logged in

**Issue**: Wrong component generated
- **Solution**: Provide the specific node-id URL or select the component in Figma first

**Issue**: Code doesn't match project style
- **Solution**: Reference CLAUDE.md and specific files to follow as examples

**Issue**: Assets not downloading
- **Solution**: Claude will provide URLs; you may need to download manually

## URL Format Reference

Figma URLs have this structure:
```
https://figma.com/design/[fileKey]/[fileName]?node-id=123-456
```

- **fileKey**: Unique identifier for the Figma file
- **node-id**: Specific component/frame (format: `number-number`)

You can get this URL by:
1. Right-clicking a frame/component in Figma
2. Selecting "Copy link to selection"

## Integration with Development Workflow

1. **Design Review**: Share Figma URL with Claude for implementation planning
2. **Code Generation**: Claude generates initial implementation
3. **Refinement**: Iterate on styling and functionality
4. **Testing**: Test on iOS/Android/Web
5. **Review**: Compare with Figma design for accuracy
6. **Commit**: Follow Conventional Commits format

## Notes

- The Figma MCP integration works best with component-based designs
- Auto-layout frames in Figma translate well to React Native Flexbox
- Complex interactions may need manual implementation after initial generation
- Always review generated code for accessibility and performance

---

**Need Help?**
Just ask Claude: "Help me implement this Figma design: [URL]" and provide context about what you're trying to achieve!
