# 🖥️ OS Memory Allocation Simulator - Enhanced Edition

An **advanced, highly interactive** web-based simulator for Operating System memory allocation strategies with real-time step-by-step visualization, animations, and educational analytics.

## ✨ Key Features

### 🎯 Core Algorithms
- **First Fit**: Scans memory sequentially, allocates at first suitable block
- **Best Fit**: Analyzes entire memory, selects smallest fitting block  
- **Worst Fit**: Chooses largest available free block to preserve space

### 🎨 Advanced Visualizations

#### 1. **Step-by-Step Execution with Animations**
- Real-time highlighting of checked memory blocks
- Smooth block animations during allocation
- Visual feedback showing algorithm decisions
- Animated block splitting when allocating to larger blocks
- Smooth coalescing animation when freeing adjacent blocks

#### 2. **Algorithm Explanation Panel**
- Dynamic explanation of what algorithm is doing at each step
- Shows decision logic in real-time
- Displays which blocks are being checked
- Explains why each block was selected or skipped
- Includes execution status with animated pulse indicator

#### 3. **Interactive Block Details on Hover**
- Hover over any memory block to see:
  - Block ID and index
  - Block size in KB
  - Allocation status (Free/Allocated)
  - Process ID (if allocated)
  - Internal fragmentation level

#### 4. **Fragmentation Visualization**
- Free blocks clearly distinguished with green gradient
- Allocated blocks shown in warm colors
- Fragmented blocks display diagonal stripe pattern
- External fragmentation counter in statistics
- Visual indication of wasted space

#### 5. **Smooth Animations & Transitions**
- Block entry/exit animations (scale + fade)
- Button hover effects with scale transforms
- Card elevation on interaction
- Pulse animations for executing operations
- Cubic-bezier timing for natural motion

#### 6. **Coalescing Animation (Advanced)**
- **Before**: Multiple adjacent free blocks shown separately
- **Animation Phase**: Blocks animate toward each other
- **After**: Single merged block appears
- Visual confirmation of successful merge
- Updated statistics reflect immediate changes

#### 7. **Multi-Algorithm Comparison Mode**
- Side-by-side view of all three algorithms
- Same allocations applied simultaneously
- Independent state for each simulator
- Compare fragmentation patterns
- Analyze efficiency differences

#### 8. **Request Queue Panel**
- Shows sequence of ALL operations:
  - Pending requests
  - Currently executing request (highlighted)
  - Completed operations
  - Failed operations
- Status badges for each request (PENDING, EXECUTING, COMPLETED, FAILED)
- Auto-removes old entries to keep view clean
- Real-time queue updates

#### 9. **Statistics Dashboard**
- **6 Key Metrics**:
  - Used Memory (KB)
  - Free Memory (KB)
  - Largest Free Block (KB)
  - Number of Free Blocks
  - External Fragmentation (count)
  - Memory Usage Percentage
  
- **Visual Progress Bar**:
  - Animated width transitions
  - Gradient fill from blue to purple
  - Real-time percentage display
  - Memory efficiency indicator

#### 10. **Modern Professional UI/UX**
- Gradient background theme (purple → violet)
- Card-based layout with shadows and borders
- Smooth color transitions
- Responsive grid system
- Interactive hover states
- Clean typography and spacing
- Accessibility-focused design

## 🚀 How to Run

### Installation
```bash
cd project
npm install     # Includes Framer Motion for animations
npm run dev     # Start dev server at http://localhost:5173
```

### Build for Production
```bash
npm run build   # Optimized production bundle
npm run preview # Preview production build locally
```

## 📖 Usage Guide

### Single Algorithm Mode
1. Select desired algorithm from dropdown
2. Set total memory size (default: 1024 KB)
3. Enter allocation size and click "➕ Allocate" 
4. Watch the step-by-step execution in Algorithm Explainer
5. Observe blocks being highlighted during search
6. View results in memory map with animation
7. Free blocks by entering process ID
8. Observe coalescing animation when freeing

### Compare Mode
1. Click "⚖️ Compare All Algorithms"
2. Perform identical allocations on all three simulators side-by-side
3. Notice different fragmentation patterns
4. Analyze efficiency metrics for each
5. Understand trade-offs between algorithms

### Interactive Features
- **Hover over blocks**: See detailed block information in tooltip
- **Watch animations**: 0.3-1.5s smooth transitions for all operations
- **Monitor queue**: Track all requests in real-time
- **Review statistics**: Live updates of memory metrics

## 📊 Algorithm Explanations

### 📍 First Fit
**Strategy**: Scans sequentially from start, allocates at first block that fits

**Advantages**:
- ✅ Fastest execution
- ✅ Low search overhead
- ✅ Simple to understand

**Disadvantages**:
- ❌ Can create small unusable gaps
- ❌ May waste memory

**Best For**: Quick allocations where speed matters

---

### 🎯 Best Fit
**Strategy**: Scans entire memory, selects smallest block that accommodates request

**Advantages**:
- ✅ Minimizes waste in selected block
- ✅ Reduces internal fragmentation
- ✅ Better memory utilization

**Disadvantages**:
- ❌ Slower than First Fit
- ❌ May leave many tiny fragments
- ❌ Higher search cost

**Best For**: Systems prioritizing minimal waste

---

### 📊 Worst Fit
**Strategy**: Selects the largest available free block

**Advantages**:
- ✅ Preserves large blocks for future large requests
- ✅ Reduces chance of allocation failures
- ✅ Better for varied request sizes

**Disadvantages**:
- ❌ Can waste large amounts of memory
- ❌ Similar cost to Best Fit
- ❌ May not be optimal

**Best For**: Systems expecting varied allocation sizes

## 🏗️ Project Architecture

### Component Structure
```
App.tsx
├── MemoryBlock (Individual block visualization)
├── MemoryVisualization (Block container & layout)
├── AlgorithmExplainer (Step-by-step explanation panel)
├── RequestQueue (Operation queue display)
├── StatisticsPanel (Dashboard with 6 metrics)
└── MemorySimulator (Main simulator logic)
    └── Multiple MemorySimulator instances in Compare mode
```

### State Management
- **React Hooks** for local state management
- Separate component instances for each algorithm
- Memoized computations for performance
- useCallback for stable function references

### Animation Framework
- **Framer Motion** for all animations
- `motion.div` for animated elements
- `AnimatePresence` for entry/exit animations
- `whileHover` for interactive effects
- Cubic-bezier easing for natural motion

## 🔧 Technical Implementation

### Key Types
```typescript
type Block = {
  id: number;
  size: number;
  allocated: boolean;
  processId?: string;
  internalFragmentation?: number;
};

type StepLog = {
  blockIndex: number;
  blockSize: number;
  action: string;        // "✓ Allocating", "❌ Failed", etc.
  reason: string;        // Explanation of decision
};

type Request = {
  id: number;
  type: 'allocate' | 'free';
  status: 'pending' | 'executing' | 'completed' | 'failed';
};
```

### Core Allocation Logic

#### First Fit Implementation
```javascript
for (let i = 0; i < memory.length; i++) {
  searchPath.push(i);
  if (!memory[i].allocated && memory[i].size >= size) {
    foundIndex = i;
    break;  // Stop at first suitable
  }
}
```

#### Best Fit Implementation
```javascript
let minSize = Infinity;
for (let i = 0; i < memory.length; i++) {
  searchPath.push(i);
  if (!memory[i].allocated && memory[i].size >= size && 
      memory[i].size < minSize) {
    minSize = memory[i].size;
    foundIndex = i;  // Continue searching for better fit
  }
}
```

#### Worst Fit Implementation
```javascript
let maxSize = -1;
for (let i = 0; i < memory.length; i++) {
  searchPath.push(i);
  if (!memory[i].allocated && memory[i].size >= size && 
      memory[i].size > maxSize) {
    maxSize = memory[i].size;
    foundIndex = i;  // Continue searching for larger block
  }
}
```

### Coalescing Algorithm
```javascript
// Mark blocks as free
const newMem = prev.map(block =>
  block.processId === freeId ? {...block, allocated: false} : block
);

// Merge adjacent free blocks
let i = 0;
while (i < newMem.length - 1) {
  if (!newMem[i].allocated && !newMem[i + 1].allocated) {
    newMem[i].size += newMem[i + 1].size;
    newMem.splice(i + 1, 1);  // Remove merged block
  } else {
    i++;
  }
}
```

## 📱 Responsive Design

### Desktop (1200px+)
- 2-column layout (Algorithm Explainer + Statistics)
- Full-size memory visualization
- 3-column comparison grid

### Tablet (768px - 1200px)
- Single column layout
- Responsive components
- 2-column comparison grid

### Mobile (< 768px)
- Full-width components
- Stacked controls
- Touch-friendly sizing

## 🎓 Learning Outcomes

Using this simulator helps you understand:

1. **Memory Management Concepts**
   - Block allocation and deallocation
   - External and internal fragmentation
   - Contiguous memory allocation

2. **Algorithm Analysis**
   - Trade-offs between speed and efficiency
   - Impact on memory fragmentation
   - Real-world algorithm selection

3. **Visual Learning**
   - See algorithms in action
   - Understand search patterns
   - Observe fragmentation buildup

## 🛠️ Technologies

- **React 18.2**: UI framework with hooks
- **TypeScript**: Full type safety
- **Framer Motion 10**: Advanced animations
- **Vite 5.0**: Lightning-fast build tool
- **CSS3**: Modern styling with gradients & animations

## 📚 Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.x"
  }
}
```

## ✨ Feature Highlights

| Feature | Status | Impact |
|---------|--------|--------|
| Step Visualization | ✅ Complete | Understand search process |
| Algorithm Explainer | ✅ Complete | Learn algorithm logic |
| Block Hover Info | ✅ Complete | Quick block inspection |
| Fragmentation Viz | ✅ Complete | Easily spot waste |
| Smooth Animations | ✅ Complete | Visual understanding |
| Coalesce Animation | ✅ Complete | See merging in action |
| Comparison Mode | ✅ Complete | Compare efficiency |
| Request Queue | ✅ Complete | Track operations |
| Statistics Dashboard | ✅ Complete | Monitor memory |
| Modern UI | ✅ Complete | Professional look |

## 🚀 Performance Optimizations

- `useMemo` for statistics calculations (avoids unnecessary recalculations)
- `useCallback` for function references (stable identity across renders)
- `AnimatePresence` with `mode="popLayout"` for smooth block transitions
- Efficient state management with minimal re-renders
- Lazy animation initialization

## 📝 Code Quality

- **TypeScript**: 100% type coverage
- **Components**: Modular and reusable
- **Performance**: Optimized calculations
- **Accessibility**: WCAG considerations
- **Comments**: Clear explanations of complex logic

## 🎬 Demo Scenarios

### Scenario 1: Fragmentation Test
- Allocate: 100, 150, 200, 50 KB
- Compare fragmentation patterns
- See First Fit create more gaps

### Scenario 2: Efficiency Test
- Allocate: 300, 200, 400 KB
- Observe memory usage percentage
- Test with different memory sizes

### Scenario 3: Coalescing
- Allocate multiple blocks
- Free blocks in different order
- Watch merging animation

## 📄 License

Open-source educational project for learning Operating Systems concepts

---

**Ready to explore memory allocation?** Start by selecting an algorithm and watching how it manages memory in real-time! 🎬✨

Built with ❤️ using React + Framer Motion + TypeScript
