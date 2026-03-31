import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Type definitions
type Block = {
  id: number;
  size: number;
  allocated: boolean;
  processId?: string;
  internalFragmentation?: number;
};

type Algorithm = 'first' | 'best' | 'worst';

type StepLog = {
  blockIndex: number;
  blockSize: number;
  action: string;
  reason: string;
};

type Request = {
  id: number;
  type: 'allocate' | 'free';
  size?: number;
  processId?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
};

type MemoryConfig = {
  totalMemory: number;
  numBlocks: number;
  blockSizes: number[];
  preAllocated: Array<{ blockIndex: number; processId: string }>;
};

// ============================================
// MEMORY SETUP PANEL COMPONENT
// ============================================
interface MemorySetupPanelProps {
  onConfigChange: (config: MemoryConfig) => void;
  initialConfig: MemoryConfig;
  disabled: boolean;
}

const MemorySetupPanel: React.FC<MemorySetupPanelProps> = ({ onConfigChange, initialConfig, disabled }) => {
  const [totalMemory, setTotalMemory] = useState(initialConfig.totalMemory);
  const [numBlocks, setNumBlocks] = useState(initialConfig.numBlocks);
  const [blockMode, setBlockMode] = useState<'equal' | 'custom'>('equal');
  const [blockSizes, setBlockSizes] = useState(initialConfig.blockSizes);
  const [preAllocBlocks, setPreAllocBlocks] = useState(initialConfig.preAllocated);
  const [preAllocId, setPreAllocId] = useState('');
  const [preAllocBlockIdx, setPreAllocBlockIdx] = useState(0);

  const blockSizePerBlock = useMemo(() => 
    Math.floor(totalMemory / numBlocks), 
    [totalMemory, numBlocks]
  );

  const handleCreateBlocks = () => {
    let newBlockSizes: number[] = [];
    if (blockMode === 'equal') {
      const baseSize = blockSizePerBlock;
      const remainder = totalMemory % numBlocks;
      newBlockSizes = Array(numBlocks).fill(baseSize);
      if (remainder > 0 && newBlockSizes.length > 0) {
        newBlockSizes[newBlockSizes.length - 1] += remainder;
      }
    }
    setBlockSizes(newBlockSizes);
  };

  const handleBlockSizeChange = (index: number, value: number) => {
    const newSizes = [...blockSizes];
    newSizes[index] = Math.max(1, value);
    setBlockSizes(newSizes);
  };

  const handleApplyConfig = () => {
    const totalSize = blockSizes.reduce((sum, size) => sum + size, 0);
    if (totalSize !== totalMemory) {
      alert(`Total block sizes (${totalSize}KB) must equal total memory (${totalMemory}KB)`);
      return;
    }
    if (blockSizes.length !== numBlocks) {
      alert(`You must define exactly ${numBlocks} blocks`);
      return;
    }
    onConfigChange({
      totalMemory,
      numBlocks,
      blockSizes,
      preAllocated: preAllocBlocks
    });
  };

  const handleAddPreAlloc = () => {
    if (!preAllocId.trim()) {
      alert('Enter a process ID');
      return;
    }
    if (preAllocBlocks.some(p => p.blockIndex === preAllocBlockIdx)) {
      alert('Block already pre-allocated');
      return;
    }
    setPreAllocBlocks([...preAllocBlocks, { blockIndex: preAllocBlockIdx, processId: preAllocId }]);
    setPreAllocId('');
  };

  const handleRemovePreAlloc = (idx: number) => {
    setPreAllocBlocks(preAllocBlocks.filter((_, i) => i !== idx));
  };

  return (
    <motion.div
      className="memory-setup-panel"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Memory Configuration</h3>
      
      {/* Memory Size Configuration */}
      <div className="setup-row">
        <div className="setup-input-group">
          <label>Total Memory Size:</label>
          <input
            type="number"
            value={totalMemory}
            onChange={e => setTotalMemory(Math.max(256, parseInt(e.target.value) || 1024))}
            min="256"
            max="8192"
            step="256"
            disabled={disabled}
          />
          <span className="unit">KB</span>
        </div>

        <div className="setup-input-group">
          <label>Number of Blocks:</label>
          <input
            type="number"
            value={numBlocks}
            onChange={e => setNumBlocks(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="20"
            disabled={disabled}
          />
          <span className="unit">blocks</span>
        </div>
      </div>

      {/* Block Mode Selection */}
      <div className="setup-row">
        <div className="setup-toggle-group">
          <label>Block Size Mode:</label>
          <div className="toggle-buttons">
            <button
              className={`toggle-btn ${blockMode === 'equal' ? 'active' : ''}`}
              onClick={() => setBlockMode('equal')}
              disabled={disabled}
            >
              Equal Size
            </button>
            <button
              className={`toggle-btn ${blockMode === 'custom' ? 'active' : ''}`}
              onClick={() => setBlockMode('custom')}
              disabled={disabled}
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Block Sizes Configuration */}
      {blockMode === 'equal' ? (
        <div className="setup-row">
          <p className="info-text">
            Each block: <strong>{blockSizePerBlock} KB</strong> {(totalMemory % numBlocks) > 0 && `(last block: ${blockSizePerBlock + (totalMemory % numBlocks)} KB)`}
          </p>
          <button onClick={handleCreateBlocks} className="btn-setup" disabled={disabled}>
            Create Equal Blocks
          </button>
        </div>
      ) : (
        <div className="setup-row">
          <div className="custom-sizes-container">
            <div className="custom-sizes-header">
              <p>Define custom block sizes:</p>
              <span className="sum-indicator">Sum: {blockSizes.reduce((a, b) => a + b, 0)} / {totalMemory} KB</span>
            </div>
            <div className="custom-sizes-grid">
              {Array.from({ length: numBlocks }).map((_, i) => (
                <div key={i} className="custom-size-input">
                  <label>Block {i + 1}:</label>
                  <input
                    type="number"
                    value={blockSizes[i] || ''}
                    onChange={e => handleBlockSizeChange(i, parseInt(e.target.value) || 0)}
                    min="1"
                    placeholder="Size"
                    disabled={disabled}
                  />
                  <span>KB</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pre-allocation Configuration */}
      <div className="setup-row">
        <div className="prealloc-container">
          <h4>Pre-allocate Blocks (Optional)</h4>
          <div className="prealloc-input-row">
            <select
              value={preAllocBlockIdx}
              onChange={e => setPreAllocBlockIdx(parseInt(e.target.value))}
              disabled={disabled || numBlocks === 0}
            >
              {Array.from({ length: numBlocks }).map((_, i) => (
                <option key={i} value={i}>
                  Block {i + 1} ({blockSizes[i] || '?'} KB)
                </option>
              ))}
            </select>
            <input
              type="text"
              value={preAllocId}
              onChange={e => setPreAllocId(e.target.value)}
              placeholder="Process ID (e.g., P1, P2)"
              disabled={disabled}
            />
            <button onClick={handleAddPreAlloc} className="btn-small" disabled={disabled}>
              Add
            </button>
          </div>
          {preAllocBlocks.length > 0 && (
            <div className="prealloc-list">
              {preAllocBlocks.map((alloc, idx) => (
                <div key={idx} className="prealloc-item">
                  <span>Block {alloc.blockIndex + 1}</span>
                  <span className="prealloc-pid">{alloc.processId}</span>
                  <button
                    onClick={() => handleRemovePreAlloc(idx)}
                    className="btn-remove"
                    disabled={disabled}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="setup-actions">
        <button onClick={handleApplyConfig} className="btn-apply" disabled={disabled || blockSizes.length === 0}>
          ✓ Apply Configuration
        </button>
      </div>
    </motion.div>
  );
};

// ============================================
// MEMORY BLOCK COMPONENT
// ============================================
interface BlockProps {
  block: Block;
  index: number;
  isHighlighted: boolean;
  onHover: (info: string | null) => void;
}

const MemoryBlock: React.FC<BlockProps> = ({ block, index, isHighlighted, onHover }) => {
  const fragLevel = block.internalFragmentation || 0;
  const isFragmented = block.allocated && fragLevel > 0;

  return (
    <motion.div
      className={`memory-block ${block.allocated ? 'allocated' : 'free'} ${isHighlighted ? 'highlighted' : ''} ${isFragmented ? 'fragmented' : ''}`}
      style={{ flex: block.size }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() =>
        onHover(
          `Block ${index} | ${block.size}KB | ${block.processId || 'Free'} | ${block.allocated ? 'Allocated' : 'Free'}${fragLevel ? ` | Frag: ${fragLevel}KB` : ''}`
        )
      }
      onHoverEnd={() => onHover(null)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="block-content">
        <div className="block-size">{block.size}KB</div>
        {block.processId && <div className="block-pid">{block.processId}</div>}
        {isFragmented && <div className="frag-indicator">Frag: {fragLevel}KB</div>}
      </div>
    </motion.div>
  );
};

// ============================================
// MEMORY VISUALIZATION COMPONENT
// ============================================
interface MemoryVisualizationProps {
  memory: Block[];
  highlightedIndices: number[];
  onBlockHover: (info: string | null) => void;
}

const MemoryVisualization: React.FC<MemoryVisualizationProps> = ({ memory, highlightedIndices, onBlockHover }) => {
  return (
    <div className="memory-visualization">
      <div className="memory-map">
        <AnimatePresence mode="popLayout">
          {memory.map((block, index) => (
            <MemoryBlock
              key={block.id}
              block={block}
              index={index}
              isHighlighted={highlightedIndices.includes(index)}
              onHover={onBlockHover}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================
// ALGORITHM EXPLAINER COMPONENT
// ============================================
interface AlgorithmExplainerProps {
  algorithm: Algorithm;
  currentStep: StepLog | null;
  isExecuting: boolean;
}

const AlgorithmExplainer: React.FC<AlgorithmExplainerProps> = ({ algorithm, currentStep, isExecuting }) => {
  const explanations: Record<Algorithm, string> = {
    first: 'First Fit scans from the beginning and allocates at the first suitable block it finds.',
    best: 'Best Fit scans all blocks and selects the smallest block that fits the request.',
    worst: 'Worst Fit selects the largest available block to preserve larger free blocks.'
  };

  return (
    <motion.div
      className="algorithm-explainer"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>
        {algorithm === 'first' && '📍 First Fit'} {algorithm === 'best' && '🎯 Best Fit'} {algorithm === 'worst' && '📊 Worst Fit'}
      </h3>
      <p className="algorithm-desc">{explanations[algorithm]}</p>

      <div className="step-log">
        {isExecuting ? (
          <div className="executing-indicator">
            <div className="pulse"></div>
            <span>Executing...</span>
          </div>
        ) : currentStep ? (
          <motion.div
            className="step-entry"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={`${currentStep.blockIndex}-${currentStep.action}`}
          >
            <p className="step-action">Block {currentStep.blockIndex}: {currentStep.blockSize}KB</p>
            <p className="step-reason">{currentStep.action}</p>
            {currentStep.reason && <p className="step-decision">→ {currentStep.reason}</p>}
          </motion.div>
        ) : (
          <p className="idle-message">Waiting for allocation request...</p>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// REQUEST QUEUE COMPONENT
// ============================================
interface RequestQueueProps {
  requests: Request[];
  currentRequestId: number | null;
}

const RequestQueue: React.FC<RequestQueueProps> = ({ requests, currentRequestId }) => {
  return (
    <motion.div
      className="request-queue"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Request Queue</h3>
      <div className="queue-list">
        <AnimatePresence>
          {requests.length === 0 ? (
            <p className="queue-empty">No requests yet</p>
          ) : (
            requests.map((req, idx) => (
              <motion.div
                key={req.id}
                className={`queue-item ${req.status} ${req.id === currentRequestId ? 'current' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <span className="index">{idx + 1}</span>
                <span className="operation">
                  {req.type === 'allocate' ? `Allocate ${req.size}KB` : `Free ${req.processId}`}
                </span>
                <span className={`badge ${req.status}`}>{req.status.toUpperCase()}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ============================================
// STATISTICS DASHBOARD COMPONENT
// ============================================
interface StatisticsPanelProps {
  totalMemory: number;
  memory: Block[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ totalMemory, memory }) => {
  const stats = useMemo(() => {
    const used = memory.filter(b => b.allocated).reduce((sum, b) => sum + b.size, 0);
    const free = totalMemory - used;
    const freeBlocks = memory.filter(b => !b.allocated);
    const largestFreeBlock = freeBlocks.length > 0 ? Math.max(...freeBlocks.map(b => b.size)) : 0;
    const externalFragmentation = Math.max(0, freeBlocks.length - 1);
    const usagePercent = Math.round((used / totalMemory) * 100);

    return { used, free, largestFreeBlock, externalFragmentation, usagePercent, freeBlocks: freeBlocks.length };
  }, [memory, totalMemory]);

  return (
    <motion.div
      className="statistics-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>Memory Statistics</h3>
      <div className="stats-grid">
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <div className="stat-value">{stats.used}</div>
          <div className="stat-unit">KB</div>
          <div className="stat-label">Used Memory</div>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <div className="stat-value">{stats.free}</div>
          <div className="stat-unit">KB</div>
          <div className="stat-label">Free Memory</div>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <div className="stat-value">{stats.largestFreeBlock}</div>
          <div className="stat-unit">KB</div>
          <div className="stat-label">Largest Free</div>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <div className="stat-value">{stats.freeBlocks}</div>
          <div className="stat-unit">blocks</div>
          <div className="stat-label">Free Blocks</div>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <div className="stat-value">{stats.externalFragmentation}</div>
          <div className="stat-unit">gaps</div>
          <div className="stat-label">Fragments</div>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <div className="stat-value">{stats.usagePercent}</div>
          <div className="stat-unit">%</div>
          <div className="stat-label">Usage</div>
        </motion.div>
      </div>

      {/* Usage Bar */}
      <div className="usage-bar-container">
        <div className="usage-bar">
          <motion.div
            className="usage-fill"
            initial={{ width: 0 }}
            animate={{ width: `${stats.usagePercent}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
        <span className="usage-text">{stats.usagePercent}% Used</span>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN SIMULATOR COMPONENT
// ============================================
interface MemorySimulatorProps {
  algorithm: Algorithm;
  config: MemoryConfig;
  isConfigured: boolean;
  isCompareMode?: boolean;
  sharedAllocSize?: string;
  sharedFreeId?: string;
  onCompareModeAllocate?: (size: number) => void;
  onCompareModeFree?: (processId: string) => void;
}

const MemorySimulator: React.FC<MemorySimulatorProps> = ({ 
  algorithm, 
  config, 
  isConfigured, 
  isCompareMode = false,
  sharedAllocSize = '',
  sharedFreeId = '',
  onCompareModeAllocate,
  onCompareModeFree
}) => {
  const [memory, setMemory] = useState<Block[]>([]);
  const [allocSize, setAllocSize] = useState('');
  const [freeId, setFreeId] = useState('');
  const [nextProcessId, setNextProcessId] = useState(1);
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<StepLog | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [blockHoverInfo, setBlockHoverInfo] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize memory blocks when config changes
  React.useEffect(() => {
    if (isConfigured && config.blockSizes.length > 0) {
      const newMemory: Block[] = config.blockSizes.map((size, i) => {
        const preAlloc = config.preAllocated.find(p => p.blockIndex === i);
        return {
          id: i,
          size,
          allocated: !!preAlloc,
          processId: preAlloc?.processId,
          internalFragmentation: 0
        };
      });
      setMemory(newMemory);
      
      // Update next process ID based on pre-allocated processes
      const maxPNum = config.preAllocated.reduce((max, p) => {
        const num = parseInt(p.processId.replace('P', ''));
        return Math.max(max, isNaN(num) ? 0 : num);
      }, 0);
      setNextProcessId(maxPNum + 1);
      setInitialized(true);
      setAllocSize('');
      setFreeId('');
      setHighlightedIndices([]);
      setCurrentStep(null);
      setRequests([]);
      setCurrentRequestId(null);
    }
  }, [isConfigured, config]);

  // Handle shared allocate in compare mode
  React.useEffect(() => {
    if (isCompareMode && sharedAllocSize && !isExecuting && initialized) {
      const size = parseInt(sharedAllocSize);
      if (!isNaN(size) && size > 0 && size <= config.totalMemory) {
        setTimeout(() => {
          const newReqId = Date.now();
          const newRequest: Request = {
            id: newReqId,
            type: 'allocate',
            size,
            status: 'executing'
          };
          setRequests(prev => [...prev, newRequest]);
          setCurrentRequestId(newReqId);
          setIsExecuting(true);

          let foundIndex = -1;
          const searchPath: number[] = [];

          if (algorithm === 'first') {
            for (let i = 0; i < memory.length; i++) {
              searchPath.push(i);
              if (!memory[i].allocated && memory[i].size >= size) {
                foundIndex = i;
                break;
              }
            }
          } else if (algorithm === 'best') {
            let minSize = Infinity;
            for (let i = 0; i < memory.length; i++) {
              searchPath.push(i);
              if (!memory[i].allocated && memory[i].size >= size && memory[i].size < minSize) {
                minSize = memory[i].size;
                foundIndex = i;
              }
            }
          } else if (algorithm === 'worst') {
            let maxSize = -1;
            for (let i = 0; i < memory.length; i++) {
              searchPath.push(i);
              if (!memory[i].allocated && memory[i].size >= size && memory[i].size > maxSize) {
                maxSize = memory[i].size;
                foundIndex = i;
              }
            }
          }

          if (foundIndex === -1) {
            setCurrentStep({
              blockIndex: -1,
              blockSize: 0,
              action: 'Allocation Failed',
              reason: 'No sufficient block'
            });
            setRequests(prev =>
              prev.map(r => (r.id === newReqId ? { ...r, status: 'failed' } : r))
            );
            setIsExecuting(false);
            setCurrentRequestId(null);
            return;
          }

          setHighlightedIndices(searchPath);
          setCurrentStep({
            blockIndex: foundIndex,
            blockSize: memory[foundIndex].size,
            action: `✓ Allocating ${size}KB`,
            reason: `Selected Block ${foundIndex}`
          });

          setTimeout(() => {
            setMemory(prev => {
              const newMem = [...prev];
              const block = newMem[foundIndex];

              if (block.size > size) {
                const newFreeBlock: Block = {
                  id: Date.now() + Math.random(),
                  size: block.size - size,
                  allocated: false,
                  internalFragmentation: 0
                };
                block.size = size;
                block.allocated = true;
                block.processId = `P${nextProcessId}`;
                newMem.splice(foundIndex + 1, 0, newFreeBlock);
              } else {
                block.allocated = true;
                block.processId = `P${nextProcessId}`;
              }

              return newMem;
            });

            setNextProcessId(prev => prev + 1);
            setHighlightedIndices([]);
            setRequests(prev =>
              prev.map(r => (r.id === newReqId ? { ...r, status: 'completed' } : r))
            );
            setIsExecuting(false);
            setCurrentRequestId(null);
            onCompareModeAllocate?.(size);
          }, 1500);
        }, 100);
      }
    }
  }, [sharedAllocSize, isCompareMode, isExecuting, initialized, algorithm, memory, config.totalMemory, nextProcessId, onCompareModeAllocate]);

  // Handle shared free in compare mode
  React.useEffect(() => {
    if (isCompareMode && sharedFreeId && !isExecuting && initialized) {
      const newReqId = Date.now();
      setIsExecuting(true);
      const newRequest: Request = {
        id: newReqId,
        type: 'free',
        processId: sharedFreeId,
        status: 'executing'
      };
      setRequests(prev => [...prev, newRequest]);
      setCurrentRequestId(newReqId);

      setCurrentStep({
        blockIndex: -1,
        blockSize: 0,
        action: `Freeing ${sharedFreeId}`,
        reason: 'Freeing blocks...'
      });

      setTimeout(() => {
        setMemory(prev => {
          const newMem = prev.map(block =>
            block.processId === sharedFreeId
              ? { ...block, allocated: false, processId: undefined }
              : block
          );

          let i = 0;
          while (i < newMem.length - 1) {
            if (!newMem[i].allocated && !newMem[i + 1].allocated) {
              newMem[i].size += newMem[i + 1].size;
              newMem.splice(i + 1, 1);
            } else {
              i++;
            }
          }

          return newMem;
        });

        setCurrentStep({
          blockIndex: -1,
          blockSize: 0,
          action: `✓ Coalesced`,
          reason: 'Adjacent free blocks merged'
        });

        setRequests(prev =>
          prev.map(r => (r.id === newReqId ? { ...r, status: 'completed' } : r))
        );

        setTimeout(() => {
          setIsExecuting(false);
          setCurrentRequestId(null);
          onCompareModeFree?.(sharedFreeId);
        }, 800);
      }, 1200);
    }
  }, [sharedFreeId, isCompareMode, isExecuting, initialized, onCompareModeFree]);

  // Reset memory to initial state
  const reset = () => {
    if (initialized) {
      const newMemory: Block[] = config.blockSizes.map((size, i) => {
        const preAlloc = config.preAllocated.find(p => p.blockIndex === i);
        return {
          id: i,
          size,
          allocated: !!preAlloc,
          processId: preAlloc?.processId,
          internalFragmentation: 0
        };
      });
      setMemory(newMemory);
      const maxPNum = config.preAllocated.reduce((max, p) => {
        const num = parseInt(p.processId.replace('P', ''));
        return Math.max(max, isNaN(num) ? 0 : num);
      }, 0);
      setNextProcessId(maxPNum + 1);
      setHighlightedIndices([]);
      setCurrentStep(null);
      setRequests([]);
      setCurrentRequestId(null);
      setAllocSize('');
      setFreeId('');
    }
  };

  // Allocate memory based on selected algorithm
  const allocate = useCallback(() => {
    if (!initialized) return;
    
    const size = parseInt(allocSize);
    if (isNaN(size) || size <= 0 || size > config.totalMemory) {
      alert('Please enter a valid size');
      return;
    }

    setIsExecuting(true);
    const reqId = Date.now();
    const newRequest: Request = {
      id: reqId,
      type: 'allocate',
      size,
      status: 'executing'
    };
    setRequests(prev => [...prev, newRequest]);
    setCurrentRequestId(reqId);

    let foundIndex = -1;
    const searchPath: number[] = [];

    if (algorithm === 'first') {
      for (let i = 0; i < memory.length; i++) {
        searchPath.push(i);
        if (!memory[i].allocated && memory[i].size >= size) {
          foundIndex = i;
          break;
        }
      }
    } else if (algorithm === 'best') {
      let minSize = Infinity;
      for (let i = 0; i < memory.length; i++) {
        searchPath.push(i);
        if (!memory[i].allocated && memory[i].size >= size && memory[i].size < minSize) {
          minSize = memory[i].size;
          foundIndex = i;
        }
      }
    } else if (algorithm === 'worst') {
      let maxSize = -1;
      for (let i = 0; i < memory.length; i++) {
        searchPath.push(i);
        if (!memory[i].allocated && memory[i].size >= size && memory[i].size > maxSize) {
          maxSize = memory[i].size;
          foundIndex = i;
        }
      }
    }

    if (foundIndex === -1) {
      setCurrentStep({
        blockIndex: -1,
        blockSize: 0,
        action: 'Allocation Failed',
        reason: 'No sufficient block found'
      });
      setRequests(prev =>
        prev.map(r => (r.id === reqId ? { ...r, status: 'failed' } : r))
      );
      setIsExecuting(false);
      setCurrentRequestId(null);
      return;
    }

    setHighlightedIndices(searchPath);
    setCurrentStep({
      blockIndex: foundIndex,
      blockSize: memory[foundIndex].size,
      action: `✓ Allocating ${size}KB`,
      reason: `Selected Block ${foundIndex} (${memory[foundIndex].size}KB)`
    });

    setTimeout(() => {
      setMemory(prev => {
        const newMem = [...prev];
        const block = newMem[foundIndex];

        if (block.size > size) {
          const newFreeBlock: Block = {
            id: Date.now(),
            size: block.size - size,
            allocated: false,
            internalFragmentation: 0
          };
          block.size = size;
          block.internalFragmentation = 0;
          block.allocated = true;
          block.processId = `P${nextProcessId}`;
          newMem.splice(foundIndex + 1, 0, newFreeBlock);
        } else {
          block.allocated = true;
          block.processId = `P${nextProcessId}`;
          block.internalFragmentation = 0;
        }

        return newMem;
      });

      setNextProcessId(prev => prev + 1);
      setHighlightedIndices([]);
      setAllocSize('');
      setRequests(prev =>
        prev.map(r => (r.id === reqId ? { ...r, status: 'completed' } : r))
      );
      setIsExecuting(false);
      setCurrentRequestId(null);
    }, 1500);
  }, [allocSize, config, memory, algorithm, nextProcessId, initialized]);

  // Free memory with coalescing animation
  const free = useCallback(() => {
    if (!initialized) return;
    
    if (!freeId.trim()) {
      alert('Please enter a process ID');
      return;
    }

    setIsExecuting(true);
    const reqId = Date.now();
    const newRequest: Request = {
      id: reqId,
      type: 'free',
      processId: freeId,
      status: 'executing'
    };
    setRequests(prev => [...prev, newRequest]);
    setCurrentRequestId(reqId);

    setCurrentStep({
      blockIndex: -1,
      blockSize: 0,
      action: `🔓 Freeing ${freeId}`,
      reason: 'Freeing blocks...'
    });

    setTimeout(() => {
      setMemory(prev => {
        const newMem = prev.map(block =>
          block.processId === freeId
            ? { ...block, allocated: false, processId: undefined }
            : block
        );

        // Coalesce adjacent free blocks with animation
        let i = 0;
        while (i < newMem.length - 1) {
          if (!newMem[i].allocated && !newMem[i + 1].allocated) {
            newMem[i].size += newMem[i + 1].size;
            newMem.splice(i + 1, 1);
          } else {
            i++;
          }
        }

        return newMem;
      });

      setCurrentStep({
        blockIndex: -1,
        blockSize: 0,
        action: `✓ Coalesced`,
        reason: 'Adjacent free blocks merged'
      });

      setFreeId('');
      setRequests(prev =>
        prev.map(r => (r.id === reqId ? { ...r, status: 'completed' } : r))
      );

      setTimeout(() => {
        setHighlightedIndices([]);
        setIsExecuting(false);
        setCurrentRequestId(null);
      }, 800);
    }, 1200);
  }, [freeId, initialized]);

  return (
    <div className="simulator-wrapper">
      <motion.div
        className="simulator"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="simulator-header">
          <h2>
            {algorithm === 'first' && 'First Fit'}
            {algorithm === 'best' && 'Best Fit'}
            {algorithm === 'worst' && 'Worst Fit'}
          </h2>
          <button onClick={reset} className="btn-reset" disabled={isExecuting || !initialized}>
            ↻ Reset
          </button>
        </div>

        {!initialized ? (
          <div className="not-configured">
            <p>Configure memory setup to start simulation</p>
          </div>
        ) : (
          <>
            {/* Block Hover Info */}
            <AnimatePresence>
              {blockHoverInfo && (
                <motion.div
                  className="hover-info"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {blockHoverInfo}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Memory Visualization */}
            <MemoryVisualization
              memory={memory}
              highlightedIndices={highlightedIndices}
              onBlockHover={setBlockHoverInfo}
            />

            {/* Two Column Layout: Algorithm Explainer + Statistics */}
            {isCompareMode ? (
              // In compare mode, show only statistics in full width
              <div className="statistics-only">
                <StatisticsPanel totalMemory={config.totalMemory} memory={memory} />
              </div>
            ) : (
              // In normal mode, show both algorithm explanation and statistics
              <div className="two-column">
                <div className="left-column">
                  <AlgorithmExplainer
                    algorithm={algorithm}
                    currentStep={currentStep}
                    isExecuting={isExecuting}
                  />
                </div>
                <div className="right-column">
                  <StatisticsPanel totalMemory={config.totalMemory} memory={memory} />
                </div>
              </div>
            )}

            {/* Controls */}
            {!isCompareMode && (
            <div className="controls-section">
              <div className="control-group">
                <label>Allocate Size:</label>
                <input
                  type="number"
                  value={allocSize}
                  onChange={e => setAllocSize(e.target.value)}
                  placeholder="e.g., 100"
                  min="1"
                  disabled={isExecuting}
                />
                <span className="unit">KB</span>
                <button onClick={allocate} className="btn-allocate" disabled={isExecuting}>
                  Allocate
                </button>
              </div>

              <div className="control-group">
                <label>Free Process:</label>
                <input
                  type="text"
                  value={freeId}
                  onChange={e => setFreeId(e.target.value)}
                  placeholder="e.g., P1"
                  disabled={isExecuting}
                />
                <button onClick={free} className="btn-free" disabled={isExecuting}>
                  Free
                </button>
              </div>
            </div>
            )}

            {/* Request Queue */}
            {!isCompareMode && (
            <RequestQueue requests={requests} currentRequestId={currentRequestId} />
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
const App: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'compare'>('single');
  const [algorithm, setAlgorithm] = useState<Algorithm>('first');
  const [memoryConfig, setMemoryConfig] = useState<MemoryConfig>({
    totalMemory: 1024,
    numBlocks: 4,
    blockSizes: [256, 256, 256, 256],
    preAllocated: []
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [sharedAllocSize, setSharedAllocSize] = useState('');
  const [sharedFreeId, setSharedFreeId] = useState('');

  const handleConfigChange = (config: MemoryConfig) => {
    setMemoryConfig(config);
    setIsConfigured(true);
  };

  const handleCompareAllocate = () => {
    if (!sharedAllocSize) return;
    setTimeout(() => setSharedAllocSize(''), 100);
  };

  const handleCompareFree = () => {
    if (!sharedFreeId) return;
    setTimeout(() => setSharedFreeId(''), 100);
  };

  return (
    <div className="app">
      <header className="app-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>🖥️ OS Memory Allocation Simulator</h1>
          <p>Interactive visualization of memory management algorithms with step-by-step execution</p>
        </motion.div>
      </header>

      {/* Memory Setup Panel */}
      <MemorySetupPanel
        onConfigChange={handleConfigChange}
        initialConfig={memoryConfig}
        disabled={isConfigured}
      />

      {/* Mode Selector */}
      <motion.div
        className="mode-selector"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <button
          onClick={() => setMode('single')}
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
        >
          <span></span> Single Algorithm
        </button>
        <button
          onClick={() => setMode('compare')}
          className={`mode-btn ${mode === 'compare' ? 'active' : ''}`}
        >
          <span></span> Compare All
        </button>
      </motion.div>

      {/* Single Mode */}
      <AnimatePresence>
        {mode === 'single' && (
          <motion.div
            key="single"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="single-view"
          >
            <div className="algorithm-selector">
              <label>Select Algorithm:</label>
              <select
                value={algorithm}
                onChange={e => setAlgorithm(e.target.value as Algorithm)}
              >
                <option value="first">First Fit - Fast, may fragment</option>
                <option value="best">Best Fit - Minimal waste</option>
                <option value="worst">Worst Fit - Preserve large blocks</option>
              </select>
            </div>
            <MemorySimulator algorithm={algorithm} config={memoryConfig} isConfigured={isConfigured} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Mode */}
      <AnimatePresence>
        {mode === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="compare-view"
          >
            <h2 className="compare-title">⚖️ Side-by-Side Comparison</h2>
            <p className="compare-subtitle">Try the same allocations to see how each algorithm differs</p>
            
            {/* Shared Controls for Compare Mode */}
            <div className="compare-controls">
              <div className="compare-control-group">
                <label>Allocate Size:</label>
                <input
                  type="number"
                  value={sharedAllocSize}
                  onChange={e => setSharedAllocSize(e.target.value)}
                  placeholder="e.g., 100"
                  min="1"
                />
                <span className="unit">KB</span>
                <button onClick={handleCompareAllocate} className="btn-allocate">
                  Allocate All
                </button>
              </div>

              <div className="compare-control-group">
                <label>Free Process:</label>
                <input
                  type="text"
                  value={sharedFreeId}
                  onChange={e => setSharedFreeId(e.target.value)}
                  placeholder="e.g., P1"
                />
                <button onClick={handleCompareFree} className="btn-free">
                  Free All
                </button>
              </div>
            </div>

            <div className="simulators-grid">
              <MemorySimulator 
                algorithm="first" 
                config={memoryConfig} 
                isConfigured={isConfigured} 
                isCompareMode={true}
                sharedAllocSize={sharedAllocSize}
                sharedFreeId={sharedFreeId}
                onCompareModeAllocate={handleCompareAllocate}
                onCompareModeFree={handleCompareFree}
              />
              <MemorySimulator 
                algorithm="best" 
                config={memoryConfig} 
                isConfigured={isConfigured} 
                isCompareMode={true}
                sharedAllocSize={sharedAllocSize}
                sharedFreeId={sharedFreeId}
                onCompareModeAllocate={handleCompareAllocate}
                onCompareModeFree={handleCompareFree}
              />
              <MemorySimulator 
                algorithm="worst" 
                config={memoryConfig} 
                isConfigured={isConfigured} 
                isCompareMode={true}
                sharedAllocSize={sharedAllocSize}
                sharedFreeId={sharedFreeId}
                onCompareModeAllocate={handleCompareAllocate}
                onCompareModeFree={handleCompareFree}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        className="app-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="footer-content">
          <div className="footer-section">
            <h4>First Fit</h4>
            <p>Scans from the start, allocates at first suitable block. Fast but may create fragments.</p>
          </div>
          <div className="footer-section">
            <h4>Best Fit</h4>
            <p>Scans all blocks, picks smallest that fits. Minimizes wasted space in blocks.</p>
          </div>
          <div className="footer-section">
            <h4>Worst Fit</h4>
            <p>Selects largest available block. Preserves large blocks for future large allocations.</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default App;
