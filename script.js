document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const container = d3.select('#visualization');
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create drag behavior
    const drag = d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded);

    // Circle data from the image - positions adjusted to prevent overlap
    const circleData = [
        { id: 'ollie', name: 'Ollie/Comms\nAgentic Squad', color: '#ff7b7b', baseSize: 100, x: centerX - 220, y: centerY - 120 },
        { id: 'conversational', name: 'Conversational\nOPQ', color: '#ff7b7b', baseSize: 80, x: centerX + 220, y: centerY - 120 },
        { id: 'stability', name: 'Stability + Offloading', color: '#7bbfff', baseSize: 70, x: centerX + 200, y: centerY + 180 },
        { id: 'liveCall', name: 'Live Call\nCoaching', color: '#ff7b7b', baseSize: 70, x: centerX - 200, y: centerY + 180 },
        { id: 'qTips', name: 'Q Tips', color: '#ff7b7b', baseSize: 60, x: centerX + 20, y: centerY + 160 },
        { id: 'qmail', name: 'QMail', color: '#ff7b7b', baseSize: 30, x: centerX, y: centerY - 150 },
        { id: 'borrower', name: 'Borrower Profile\nBlueprint', color: '#ff7b7b', baseSize: 40, x: centerX - 120, y: centerY + 40 },
        { id: 'qFile', name: 'Q\'s File\nSummary', color: '#ff7b7b', baseSize: 35, x: centerX + 120, y: centerY + 40 },
        { id: 'tests', name: 'Q\'s Suggested\nTests', color: '#ff7b7b', baseSize: 25, x: centerX - 280, y: centerY + 40 }
    ];
    
    // Initialize empty flows array - connections will be added by user selection
    const flows = [];

    // Store active connections to prevent duplicates
    const activeConnections = new Set();
    
    // Track selected circles for connections
    let selectedSource = null;
    let selectedTarget = null;

    // Populate the dropdown selectors with circle options
    const sourceSelect = document.getElementById('source-select');
    const targetSelect = document.getElementById('target-select');
    
    circleData.forEach(circle => {
        // Add to source dropdown
        const sourceOption = document.createElement('option');
        sourceOption.value = circle.id;
        sourceOption.textContent = circle.name.split('\n')[0]; // Use first line of name
        sourceSelect.appendChild(sourceOption);
        
        // Add to target dropdown
        const targetOption = document.createElement('option');
        targetOption.value = circle.id;
        targetOption.textContent = circle.name.split('\n')[0]; // Use first line of name
        targetSelect.appendChild(targetOption);
    });
    
    // Create SVG container
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
        
    // Create a group for connections that will be below circles
    const connectionsGroup = svg.append('g')
        .attr('class', 'connections');
        
    // Create tooltip
    const tooltip = container.append('div')
        .attr('class', 'tooltip');

    // Create circles
    const circles = svg.selectAll('.circle-group')
        .data(circleData)
        .enter()
        .append('g')
        .attr('class', 'circle-group')
        .attr('data-id', d => d.id)
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .call(drag)
        .style('cursor', 'pointer'); // Change to pointer to indicate clickable

    circles.append('circle')
        .attr('r', d => d.baseSize)
        .attr('fill', d => d.color)
        .attr('opacity', 0.8)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Add text labels
    circles.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', 'white')
        .attr('font-size', d => Math.max(10, d.baseSize / 5))
        .style('pointer-events', 'none')
        .text(d => d.name)
        .call(wrapText, 30);

    // Animation variables
    let animationRunning = false;
    let animationInterval;

    // Animation function
    function startAnimation() {
        if (animationRunning) return;
        
        animationRunning = true;
        document.getElementById('animate-btn').textContent = 'Stop Animation';
        
        // Initial size adjustment based on connections
        // Make source circles smaller and target circles bigger
        adjustCircleSizesBasedOnConnections();
        
        // Continue animating the flow particles but not the circle sizes
        // The animationRunning flag will still be true to keep particles moving
    }

    // Stop animation
    function stopAnimation() {
        clearInterval(animationInterval);
        animationRunning = false;
        document.getElementById('animate-btn').textContent = 'Start Animation';
    }

    // Reset to original sizes
    function resetCircles() {
        circles.each(function(d) {
            const circle = d3.select(this).select('circle');
            const text = d3.select(this).select('text');
            
            // Reset to base size
            d.currentSize = d.baseSize;
            
            circle.transition()
                .duration(1000)
                .attr('r', d.baseSize);
            
            text.transition()
                .duration(1000)
                .attr('font-size', Math.max(10, d.baseSize / 5));
        });
    }

    // Add interactivity
    circles.on('mouseover', function(event, d) {
        d3.select(this).select('circle')
            .transition()
            .duration(300)
            .attr('opacity', 1)
            .attr('stroke-width', 3);
            
        // Highlight connected flow lines
        connectionsGroup.selectAll('.flow-line')
            .filter(flow => flow.source.id === d.id || flow.target.id === d.id)
            .transition()
            .duration(300)
            .style('opacity', 0.8)
            .style('stroke-width', 2);
            
        // Highlight flow particles
        connectionsGroup.selectAll('.flow-particle')
            .filter(function() {
                const parentData = d3.select(this.parentNode).datum();
                return parentData && (parentData.source.id === d.id || parentData.target.id === d.id);
            })
            .transition()
            .duration(300)
            .attr('r', 4)
            .style('opacity', 1);
            
        tooltip.style('opacity', 1)
            .html(`${d.name}`)
            .style('left', (event.pageX - container.node().offsetLeft + 10) + 'px')
            .style('top', (event.pageY - container.node().offsetTop - 30) + 'px');
    })
    .on('mouseout', function() {
        d3.select(this).select('circle')
            .transition()
            .duration(300)
            .attr('opacity', 0.8)
            .attr('stroke-width', 2);
            
        // Reset flow lines
        connectionsGroup.selectAll('.flow-line')
            .transition()
            .duration(300)
            .style('opacity', 0.4)
            .style('stroke-width', 1);
            
        // Reset flow particles
        connectionsGroup.selectAll('.flow-particle')
            .transition()
            .duration(300)
            .attr('r', 3)
            .style('opacity', 0.8);
            
        tooltip.style('opacity', 0);
    })
    .on('click', function(event, d) {
        // On click, select this circle for creating connections
        const circleElement = d3.select(this);

        // Highlight the selected circle
        circles.selectAll('circle').attr('stroke', '#fff');
        circleElement.select('circle').attr('stroke', '#ffcc00').attr('stroke-width', 3);

        // Update the dropdown selection
        if (!sourceSelect.value) {
            sourceSelect.value = d.id;
        } else if (!targetSelect.value) {
            targetSelect.value = d.id;
        } else {
            // If both are already selected, update the source and clear target
            sourceSelect.value = d.id;
            targetSelect.value = '';
        }
    });

    // Button event listeners
    document.getElementById('animate-btn').addEventListener('click', function() {
        if (animationRunning) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });

    document.getElementById('reset-btn').addEventListener('click', function() {
        stopAnimation();
        resetCircles();
    });

    // Simulation functionality
    let simulationRunning = false;
    let simulationRound = 0;
    const maxSimulationRounds = 5;
    let simulationInterval;
    
    function runSimulation() {
        if (simulationRunning) {
            stopSimulation();
            return;
        }
        
        simulationRunning = true;
        document.getElementById('simulate-btn').textContent = 'Stop Simulation';
        document.getElementById('simulate-btn').classList.add('active');
        
        // Start the simulation process
        simulationRound = 0;
        nextSimulationRound();
    }
    
    function stopSimulation() {
        clearTimeout(simulationInterval);
        simulationRunning = false;
        document.getElementById('simulate-btn').textContent = 'Simulate';
        document.getElementById('simulate-btn').classList.remove('active');
        stopAnimation();
    }
    
    function nextSimulationRound() {
        if (!simulationRunning || simulationRound >= maxSimulationRounds) {
            stopSimulation();
            return;
        }
        
        simulationRound++;
        
        // Clear previous connections
        clearConnections();
        
        // Reset circles to original sizes
        resetCircles();
        
        // Create new random connections
        createRandomConnections();
        
        // Start animation for this round
        startAnimation();
        
        // Force circle size adjustment for each round
        adjustCircleSizesBasedOnConnections();
        
        // Show round number in the center of visualization
        const roundIndicator = document.createElement('div');
        roundIndicator.className = 'round-indicator';
        roundIndicator.textContent = `Round ${simulationRound} of ${maxSimulationRounds}`;
        document.getElementById('visualization').appendChild(roundIndicator);
        
        // Remove the indicator after a delay
        setTimeout(() => {
            if (roundIndicator.parentNode) {
                roundIndicator.parentNode.removeChild(roundIndicator);
            }
        }, 3000);
        
        // Schedule next round
        simulationInterval = setTimeout(nextSimulationRound, 5000);
    }
    
    document.getElementById('simulate-btn').addEventListener('click', runSimulation);

    document.getElementById('reset-btn').addEventListener('click', function() {
        stopAnimation();
        stopSimulation();
        resetCircles();
    });

    // Flow rate slider value display
    document.getElementById('flow-rate').addEventListener('input', function() {
        document.getElementById('flow-rate-value').textContent = this.value;
    });

    // Add connection button handler
    document.getElementById('add-connection-btn').addEventListener('click', function() {
        const sourceId = sourceSelect.value;
        const targetId = targetSelect.value;
        const flowRate = parseInt(document.getElementById('flow-rate').value);

        if (!sourceId || !targetId) {
            alert('Please select both source and target circles');
            return;
        }

        if (sourceId === targetId) {
            alert('Source and target cannot be the same circle');
            return;
        }

        // Check if this connection already exists
        const connectionKey = `${sourceId}-${targetId}`;
        if (activeConnections.has(connectionKey)) {
            alert('This connection already exists');
            return;
        }

        // Add the new connection
        flows.push({ source: sourceId, target: targetId, flowRate: flowRate });
        activeConnections.add(connectionKey);

        // Update the visualization
        updateVisualization();

        // Reset the selectors
        sourceSelect.value = '';
        targetSelect.value = '';
        
        // Reset circle highlights
        circles.selectAll('circle').attr('stroke', '#fff').attr('stroke-width', 2);
    });

    // Clear all connections button handler
    document.getElementById('clear-connections-btn').addEventListener('click', function() {
        clearConnections();
    });
    
    // Function to clear all connections
    function clearConnections() {
        // Clear all connections
        flows.length = 0;
        activeConnections.clear();

        // Remove all flow lines and particles
        connectionsGroup.selectAll('*').remove();

        // Reset circle sizes
        resetCircles();
        
        // Reset circle highlights
        circles.selectAll('circle').attr('stroke', '#fff').attr('stroke-width', 2);
    }
    
    // Random connections button handler
    document.getElementById('random-connections-btn').addEventListener('click', function() {
        createRandomConnections();
    });
    
    // Function to create random connections
    function createRandomConnections() {
        // Clear existing connections first
        flows.length = 0;
        activeConnections.clear();
        connectionsGroup.selectAll('*').remove();
        resetCircles();
        
        // Get all circle IDs
        const circleIds = circleData.map(circle => circle.id);
        
        // Create a random number of connections (between 5-10)
        const numConnections = 5 + Math.floor(Math.random() * 6);
        
        // Create random connections
        for (let i = 0; i < numConnections; i++) {
            // Pick random source and target
            const sourceIndex = Math.floor(Math.random() * circleIds.length);
            let targetIndex;
            do {
                targetIndex = Math.floor(Math.random() * circleIds.length);
            } while (targetIndex === sourceIndex); // Ensure source != target
            
            const sourceId = circleIds[sourceIndex];
            const targetId = circleIds[targetIndex];
            
            // Generate random flow rate (1-5)
            const flowRate = 1 + Math.floor(Math.random() * 5);
            
            // Check if this connection already exists
            const connectionKey = `${sourceId}-${targetId}`;
            if (!activeConnections.has(connectionKey)) {
                // Add the new connection
                flows.push({ source: sourceId, target: targetId, flowRate: flowRate });
                activeConnections.add(connectionKey);
            }
        }
        
        // Update the visualization
        updateVisualization();
    }
    
    // Function to adjust circle sizes based on connections
    function adjustCircleSizesBasedOnConnections() {
        // Create a map to track flow in/out for each circle
        const flowMap = new Map();
        
        // Initialize flow map with all circles
        circleData.forEach(circle => {
            flowMap.set(circle.id, { inFlow: 0, outFlow: 0 });
        });
        
        // Calculate total in/out flow for each circle
        flows.forEach(flow => {
            const sourceFlow = flowMap.get(flow.source);
            const targetFlow = flowMap.get(flow.target);
            
            sourceFlow.outFlow += flow.flowRate;
            targetFlow.inFlow += flow.flowRate;
        });
        
        // Adjust circle sizes based on flow
        circles.selectAll('circle')
            .transition()
            .duration(1000)
            .attr('r', d => {
                const flow = flowMap.get(d.id);
                const netFlow = flow.inFlow - flow.outFlow;
                return d.baseRadius + (netFlow * 2); // Adjust size based on net flow
            });
    }

    // Update the entire visualization
    function updateVisualization() {
        // Clear existing connections
        connectionsGroup.selectAll('*').remove();
        
        // Create new flow lines
        const flowData = createFlowLines();
        
        // Animate the flows
        animateFlows(flowData);
        
        // Don't automatically update circle sizes when adding connections
        // Circle sizes will only change during animation
    }

    // Create flow lines between circles
    function createFlowLines() {
        // Define arrow marker for flow direction
        svg.append('defs').selectAll('marker')
            .data(['flow-marker'])
            .enter().append('marker')
            .attr('id', d => d)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('class', 'flow-arrow')
            .attr('d', 'M0,-5L10,0L0,5');
            
        // Process the flows data to include actual circle objects
        const flowData = flows.map(flow => {
            const sourceCircle = circleData.find(c => c.id === flow.source);
            const targetCircle = circleData.find(c => c.id === flow.target);
            return {
                source: sourceCircle,
                target: targetCircle,
                flowRate: flow.flowRate,
                particles: [] // Will store particle positions for animation
            };
        });

        // Create the flow lines
        connectionsGroup.selectAll('.flow-line')
            .data(flowData)
            .enter()
            .append('path')
            .attr('class', 'flow-line')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', d => 1 + d.flowRate * 0.2) // Thicker lines for higher flow rates
            .attr('fill', 'none')
            .attr('marker-end', 'url(#flow-marker)') // Add arrow marker
            .style('opacity', 0.4)
            .style('stroke-dasharray', d => `${3 + d.flowRate},${6 - d.flowRate/2}`) // Dash pattern based on flow rate
            .attr('stroke-dashoffset', 0);

        // Create particle groups for each flow line
        const particleGroups = connectionsGroup.selectAll('.particle-group')
            .data(flowData)
            .enter()
            .append('g')
            .attr('class', 'particle-group');

        // Initial positioning of flow lines
        updateFlowLines();

        return flowData;
    }

    // Update flow line positions when circles move
    function updateFlowLines() {
        connectionsGroup.selectAll('.flow-line')
            .attr('d', d => {
                const sourceX = d.source.x;
                const sourceY = d.source.y;
                const targetX = d.target.x;
                const targetY = d.target.y;

                // Calculate the distance between circles
                const dx = targetX - sourceX;
                const dy = targetY - sourceY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Calculate the points where the line should start and end
                // (at the edge of each circle, not the center)
                const sourceR = parseFloat(d3.select(`g[data-id='${d.source.id}']`).select('circle').attr('r')) || d.source.baseSize;
                const targetR = parseFloat(d3.select(`g[data-id='${d.target.id}']`).select('circle').attr('r')) || d.target.baseSize;

                const sourceOffsetX = sourceX + (dx * sourceR / distance);
                const sourceOffsetY = sourceY + (dy * sourceR / distance);
                const targetOffsetX = targetX - (dx * targetR / distance);
                const targetOffsetY = targetY - (dy * targetR / distance);

                // Create a curved path
                const midX = (sourceOffsetX + targetOffsetX) / 2;
                const midY = (sourceOffsetY + targetOffsetY) / 2;
                const curveFactor = 30; // Controls how much the curve bends

                // Perpendicular offset for the control point
                const perpX = -dy * curveFactor / distance;
                const perpY = dx * curveFactor / distance;

                // Store path data for particle animations
                d.pathData = {
                    sourceX: sourceOffsetX,
                    sourceY: sourceOffsetY,
                    targetX: targetOffsetX,
                    targetY: targetOffsetY,
                    controlX: midX + perpX,
                    controlY: midY + perpY
                };

                return `M${sourceOffsetX},${sourceOffsetY} Q${midX + perpX},${midY + perpY} ${targetOffsetX},${targetOffsetY}`;
            });
    }

    // Animate people flowing between circles
    function animateFlows(flowData) {
        // Store circle size changes for each flow cycle
        const sizeChanges = {};
        circleData.forEach(circle => {
            sizeChanges[circle.id] = 0;
        });

        // Animate flow lines with moving dash pattern
        connectionsGroup.selectAll('.flow-line')
            .each(function(d) {
                const line = d3.select(this);
                const dashLength = parseFloat(line.style('stroke-dasharray').split(',')[0]) || 3;
                const dashGap = parseFloat(line.style('stroke-dasharray').split(',')[1]) || 3;
                const totalLength = dashLength + dashGap;

                // Animation speed based on flow rate
                const duration = 3000 - (d.flowRate * 300); // Faster for higher flow rates

                function animateDashes() {
                    line.attr('stroke-dashoffset', totalLength)
                        .transition()
                        .duration(duration)
                        .ease(d3.easeLinear)
                        .attr('stroke-dashoffset', 0)
                        .on('end', animateDashes);
                }

                animateDashes();
            });

        // Create particles for each flow line
        flowData.forEach(flow => {
            // Number of particles based on flow rate
            const numParticles = flow.flowRate;
            flow.particles = [];

            // Initialize particles at random positions along the path
            for (let i = 0; i < numParticles; i++) {
                flow.particles.push({
                    id: i,
                    progress: Math.random(), // Random position along the path (0-1)
                    element: null
                });
            }

            // Create SVG elements for particles
            const particleGroup = connectionsGroup.select(`.particle-group:nth-child(${flowData.indexOf(flow) + 1})`);

            flow.particles.forEach(particle => {
                // Size based on progress - smaller at start, larger at end
                const baseSize = 2 + flow.flowRate * 0.3;
                particle.element = particleGroup.append('circle')
                    .attr('class', 'flow-particle')
                    .attr('r', baseSize)
                    .attr('fill', '#ffffff')
                    .style('opacity', 0.8);
                
                // Store base size for animation
                particle.baseSize = baseSize;
            });
        });

        // Animation function to update particle positions
        function animateParticles() {
            // Reset size changes for this cycle
            Object.keys(sizeChanges).forEach(id => {
                sizeChanges[id] = 0;
            });

            // Update each flow's particles
            flowData.forEach(flow => {
                // Calculate speed based on flow rate (same as line animation)
                const speed = 0.005 + (flow.flowRate * 0.002); // Faster for higher flow rates

                flow.particles.forEach(particle => {
                    // Update particle position along the path
                    particle.progress += speed;

                    // When a particle reaches the end
                    if (particle.progress >= 1) {
                        // Reset to start
                        particle.progress = 0;
                        
                        // We no longer record size changes for continuous animation
                        // sizeChanges[flow.source.id] -= 1; // Source loses a person
                        // sizeChanges[flow.target.id] += 1; // Target gains a person
                    }

                    // Calculate position along the quadratic Bezier curve
                    if (flow.pathData) {
                        const t = particle.progress;
                        const p0x = flow.pathData.sourceX;
                        const p0y = flow.pathData.sourceY;
                        const p1x = flow.pathData.controlX;
                        const p1y = flow.pathData.controlY;
                        const p2x = flow.pathData.targetX;
                        const p2y = flow.pathData.targetY;
                        
                        // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
                        const x = Math.pow(1-t, 2) * p0x + 2 * (1-t) * t * p1x + Math.pow(t, 2) * p2x;
                        const y = Math.pow(1-t, 2) * p0y + 2 * (1-t) * t * p1y + Math.pow(t, 2) * p2y;
                        
                        // Size increases as particle moves toward target
                        const sizeMultiplier = 1 + t * 0.8; // 1.0 at source, 1.8 at target
                        const particleSize = particle.baseSize * sizeMultiplier;
                        
                        // Opacity increases slightly toward target
                        const opacity = 0.7 + t * 0.3;
                        
                        // Update particle position and appearance
                        particle.element
                            .attr('cx', x)
                            .attr('cy', y)
                            .attr('r', particleSize)
                            .style('opacity', opacity);
                    }
                });
            });
            
            // Update circle sizes based on flow
            updateCircleSizesFromFlow(sizeChanges);
            
            // Continue animation
            requestAnimationFrame(animateParticles);
        }

        // Start the animation
        animateParticles();
    }

    // Update circle sizes based on flow changes
    function updateCircleSizesFromFlow(sizeChanges) {
        // We've disabled continuous size changes
        // The initial size adjustment is done by adjustCircleSizesBasedOnConnections
        // This function is now a no-op to prevent further size changes
        return;
    }

    // Update circle sizes based on connections
    function updateCircleSizes() {
        // Calculate net flow for each circle
        const netFlows = {};
        circleData.forEach(circle => {
            netFlows[circle.id] = 0;
        });
        
        // Calculate outgoing and incoming flows
        flows.forEach(flow => {
            netFlows[flow.source] -= flow.flowRate;
            netFlows[flow.target] += flow.flowRate;
        });
        
        // Update circle sizes based on net flow
        circles.each(function(d) {
            const circle = d3.select(this).select('circle');
            const text = d3.select(this).select('text');
            
            // Calculate size factor based on net flow
            // Positive net flow = circle grows, negative = circle shrinks
            const netFlow = netFlows[d.id];
            const sizeFactor = 1 + (netFlow * 0.05); // 5% change per flow unit
            
            // Calculate new size (clamped between 50% and 200% of base size)
            const newSize = Math.max(d.baseSize * 0.5, Math.min(d.baseSize * 2, d.baseSize * sizeFactor));
            
            // Animate to new size
            circle.transition()
                .duration(1000)
                .attr('r', newSize);
                
            // Update text size proportionally
            text.transition()
                .duration(1000)
                .attr('font-size', Math.max(10, newSize / 5));
        });
    }
    
    // Adjust circle sizes based on connections when animation starts
    function adjustCircleSizesBasedOnConnections() {
        // Calculate initial size adjustments for each circle
        const sizeAdjustments = {};
        circleData.forEach(circle => {
            sizeAdjustments[circle.id] = 0;
        });
        
        // For each flow, make source smaller and target bigger
        flows.forEach(flow => {
            // Source gets smaller based on flow rate
            sizeAdjustments[flow.source] -= flow.flowRate * 0.1; // 10% reduction per flow unit
            
            // Target gets bigger based on flow rate
            sizeAdjustments[flow.target] += flow.flowRate * 0.1; // 10% increase per flow unit
        });
        
        // Apply size adjustments to circles
        circles.each(function(d) {
            const adjustment = sizeAdjustments[d.id];
            if (adjustment !== 0) {
                const circle = d3.select(this).select('circle');
                const text = d3.select(this).select('text');
                
                // Calculate new size (clamped between 50% and 200% of base size)
                const sizeFactor = 1 + adjustment;
                const newSize = Math.max(d.baseSize * 0.5, Math.min(d.baseSize * 2, d.baseSize * sizeFactor));
                
                // Animate to new size
                circle.transition()
                    .duration(1000)
                    .attr('r', newSize);
                    
                // Update text size proportionally
                text.transition()
                    .duration(1000)
                    .attr('font-size', Math.max(10, newSize / 5));
            }
        });
    }

    // Text wrapping function for circle labels
    function wrapText(text, width) {
        text.each(function() {
            const text = d3.select(this);
            const words = text.text().split(/\n/);
            
            text.text(null);
            
            let lineNumber = 0;
            const lineHeight = 1.1;
            
            words.forEach(word => {
                text.append('tspan')
                    .attr('x', 0)
                    .attr('y', lineNumber * lineHeight + 'em')
                    .attr('dy', lineNumber === 0 ? '0' : '1em')
                    .text(word);
                    
                lineNumber++;
            });
            
            // Center the text vertically based on the number of lines
            const tspans = text.selectAll('tspan');
            const totalLines = tspans.size();
            
            tspans.attr('dy', function(d, i) {
                const offset = -((totalLines - 1) * lineHeight) / 2;
                return (i === 0 ? offset : lineHeight) + 'em';
            });
        });
    }
    
    // Drag functions
    function dragStarted(event, d) {
        d3.select(this).raise().attr('stroke', 'black');
        // Store original position in case we need it
        d._x = d.x;
        d._y = d.y;
    }
    
    function dragged(event, d) {
        // Update data position
        d.x = event.x;
        d.y = event.y;
        // Update visual position
        d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
        
        // Hide tooltip during drag
        tooltip.style('opacity', 0);
        
        // Update flow lines if they exist
        if (flows.length > 0) {
            updateFlowLines();
        }
    }
    
    function dragEnded(event, d) {
        d3.select(this).attr('stroke', null);
        
        // Ensure the circle stays within bounds
        const r = parseFloat(d3.select(this).select('circle').attr('r'));
        
        if (d.x - r < 0) d.x = r;
        if (d.x + r > width) d.x = width - r;
        if (d.y - r < 0) d.y = r;
        if (d.y + r > height) d.y = height - r;
        
        d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
        
        // Update flow lines if they exist
        if (flows.length > 0) {
            updateFlowLines();
        }
    }
    
    // Info button and modal functionality
    const infoModal = document.getElementById('info-modal');
    const infoBtn = document.getElementById('info-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    
    // Show modal when info button is clicked
    infoBtn.addEventListener('click', function() {
        infoModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    });
    
    // Close modal when X is clicked
    closeModalBtn.addEventListener('click', function() {
        infoModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === infoModal) {
            infoModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && infoModal.style.display === 'block') {
            infoModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});
