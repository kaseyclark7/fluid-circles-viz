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

    // Circle data from the image
    const circleData = [
        { id: 'ollie', name: 'Ollie/Comms\nAgentic Squad', color: '#ff7b7b', baseSize: 100, x: centerX - 150, y: centerY - 50 },
        { id: 'conversational', name: 'Conversational\nOPQ', color: '#ff7b7b', baseSize: 80, x: centerX + 150, y: centerY - 50 },
        { id: 'stability', name: 'Stability + Offloading', color: '#7bbfff', baseSize: 70, x: centerX + 150, y: centerY + 150 },
        { id: 'liveCall', name: 'Live Call\nCoaching', color: '#ff7b7b', baseSize: 70, x: centerX - 100, y: centerY + 150 },
        { id: 'qTips', name: 'Q Tips', color: '#ff7b7b', baseSize: 60, x: centerX + 50, y: centerY + 200 },
        { id: 'qmail', name: 'QMail', color: '#ff7b7b', baseSize: 30, x: centerX, y: centerY - 150 },
        { id: 'borrower', name: 'Borrower Profile\nBlueprint', color: '#ff7b7b', baseSize: 40, x: centerX - 50, y: centerY + 50 },
        { id: 'qFile', name: 'Q\'s File\nSummary', color: '#ff7b7b', baseSize: 35, x: centerX + 50, y: centerY + 50 },
        { id: 'tests', name: 'Q\'s Suggested\nTests', color: '#ff7b7b', baseSize: 25, x: centerX - 200, y: centerY + 50 }
    ];
    
    // Define flows between circles (people moving between squads)
    const flows = [
        { source: 'ollie', target: 'conversational', flowRate: 5 },
        { source: 'ollie', target: 'stability', flowRate: 3 },
        { source: 'ollie', target: 'liveCall', flowRate: 4 },
        { source: 'conversational', target: 'qTips', flowRate: 2 },
        { source: 'conversational', target: 'qmail', flowRate: 3 },
        { source: 'stability', target: 'qFile', flowRate: 2 },
        { source: 'liveCall', target: 'borrower', flowRate: 4 },
        { source: 'qTips', target: 'tests', flowRate: 2 },
        { source: 'borrower', target: 'qFile', flowRate: 1 }
    ];

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
        .style('cursor', 'move');

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
        
        animationInterval = setInterval(() => {
            // Update circle sizes randomly
            circles.each(function(d) {
                const circle = d3.select(this).select('circle');
                const text = d3.select(this).select('text');
                
                // Random size change between 70% and 130% of base size
                const newSize = d.baseSize * (0.7 + Math.random() * 0.6);
                
                circle.transition()
                    .duration(2000)
                    .ease(d3.easeCubicInOut)
                    .attr('r', newSize);
                
                // Update text size proportionally
                text.transition()
                    .duration(2000)
                    .ease(d3.easeCubicInOut)
                    .attr('font-size', Math.max(10, newSize / 5));
            });
        }, 3000);
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
        // On click, make this circle grow or shrink dramatically
        const circle = d3.select(this).select('circle');
        const text = d3.select(this).select('text');
        const currentSize = parseFloat(circle.attr('r'));
        const newSize = currentSize === d.baseSize ? d.baseSize * 1.5 : d.baseSize;
        
        circle.transition()
            .duration(800)
            .attr('r', newSize);
            
        text.transition()
            .duration(800)
            .attr('font-size', Math.max(10, newSize / 5));
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
    
    // Create flow lines between circles
    function createFlowLines() {
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
            .attr('stroke-width', 1)
            .attr('fill', 'none')
            .style('opacity', 0.4)
            .style('stroke-dasharray', '3,3'); // All lines are dotted
            
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
                particle.element = particleGroup.append('circle')
                    .attr('class', 'flow-particle')
                    .attr('r', 3)
                    .attr('fill', '#ffffff')
                    .style('opacity', 0.8);
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
                flow.particles.forEach(particle => {
                    // Update particle position along the path
                    particle.progress += 0.01; // Speed of movement
                    
                    // When a particle reaches the end
                    if (particle.progress >= 1) {
                        // Reset to start
                        particle.progress = 0;
                        
                        // Track size changes: source gets smaller, target gets bigger
                        sizeChanges[flow.source.id] -= 1;
                        sizeChanges[flow.target.id] += 1;
                    }
                    
                    // Calculate position on the quadratic curve
                    if (flow.pathData) {
                        const t = particle.progress;
                        const p = flow.pathData;
                        
                        // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
                        const x = Math.pow(1-t, 2) * p.sourceX + 
                                2 * (1-t) * t * p.controlX + 
                                Math.pow(t, 2) * p.targetX;
                                
                        const y = Math.pow(1-t, 2) * p.sourceY + 
                                2 * (1-t) * t * p.controlY + 
                                Math.pow(t, 2) * p.targetY;
                        
                        // Update particle position
                        particle.element
                            .attr('cx', x)
                            .attr('cy', y);
                    }
                });
            });
            
            // Apply size changes to circles
            circles.each(function(d) {
                if (sizeChanges[d.id] !== 0) {
                    const circle = d3.select(this).select('circle');
                    const text = d3.select(this).select('text');
                    const currentSize = parseFloat(circle.attr('r'));
                    
                    // Change size based on flow (max 10% change per cycle)
                    const sizeChange = Math.min(Math.max(sizeChanges[d.id], -2), 2);
                    const newSize = Math.max(d.baseSize * 0.5, Math.min(d.baseSize * 1.5, currentSize + sizeChange));
                    
                    circle.transition()
                        .duration(500)
                        .attr('r', newSize);
                        
                    text.transition()
                        .duration(500)
                        .attr('font-size', Math.max(10, newSize / 5));
                }
            });
        }
        
        // Run the animation loop
        setInterval(animateParticles, 100);
    }
    
    // Create flow lines and start animation
    const flowData = createFlowLines();
    animateFlows(flowData);

    // Function to wrap text
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
        
        // Update flow lines positions
        updateFlowLines();
    }

    // Add manual control for individual circles
    const controlPanel = d3.select('.controls');
    
    controlPanel.append('div')
        .attr('class', 'size-controls')
        .html('<label>Manual Size Control: </label>');
    
    const sizeSlider = controlPanel.select('.size-controls')
        .append('input')
        .attr('type', 'range')
        .attr('min', 0.5)
        .attr('max', 2)
        .attr('step', 0.1)
        .attr('value', 1);
        
    const circleSelector = controlPanel.select('.size-controls')
        .append('select');
        
    circleSelector.append('option')
        .attr('value', 'all')
        .text('All Circles');
        
    circleData.forEach(d => {
        circleSelector.append('option')
            .attr('value', d.id)
            .text(d.name.split('\\n')[0]);
    });
    
    sizeSlider.on('input', function() {
        const value = parseFloat(this.value);
        const selected = circleSelector.property('value');
        
        circles.each(function(d) {
            if (selected === 'all' || selected === d.id) {
                const circle = d3.select(this).select('circle');
                const text = d3.select(this).select('text');
                
                const newSize = d.baseSize * value;
                
                circle.transition()
                    .duration(100)
                    .attr('r', newSize);
                    
                text.transition()
                    .duration(100)
                    .attr('font-size', Math.max(10, newSize / 5));
            }
        });
    });
});
