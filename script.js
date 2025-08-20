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
    
    // Define relationships between circles
    const relationships = [
        { source: 'ollie', target: 'conversational', strength: 'strong' },
        { source: 'ollie', target: 'stability', strength: 'medium' },
        { source: 'ollie', target: 'liveCall', strength: 'strong' },
        { source: 'conversational', target: 'qTips', strength: 'medium' },
        { source: 'conversational', target: 'qmail', strength: 'strong' },
        { source: 'stability', target: 'qFile', strength: 'medium' },
        { source: 'liveCall', target: 'borrower', strength: 'strong' },
        { source: 'qTips', target: 'tests', strength: 'medium' },
        { source: 'borrower', target: 'qFile', strength: 'weak' }
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
            
        // Highlight connected lines
        connectionsGroup.selectAll('.connection')
            .filter(conn => conn.source.id === d.id || conn.target.id === d.id)
            .transition()
            .duration(300)
            .style('opacity', 1)
            .style('stroke-width', line => line.strength === 'strong' ? 4 : (line.strength === 'medium' ? 3 : 2));
            
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
            
        // Reset connection lines
        connectionsGroup.selectAll('.connection')
            .transition()
            .duration(300)
            .style('opacity', 0.5)
            .style('stroke-width', line => line.strength === 'strong' ? 3 : (line.strength === 'medium' ? 2 : 1));
            
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
    
    // Create connection lines between related circles
    function createConnections() {
        // Process the relationships data to include actual circle objects
        const connectionData = relationships.map(rel => {
            const sourceCircle = circleData.find(c => c.id === rel.source);
            const targetCircle = circleData.find(c => c.id === rel.target);
            return {
                source: sourceCircle,
                target: targetCircle,
                strength: rel.strength
            };
        });
        
        // Create the connection lines
        connectionsGroup.selectAll('.connection')
            .data(connectionData)
            .enter()
            .append('path')
            .attr('class', 'connection')
            .attr('stroke', d => {
                // Color based on strength
                if (d.strength === 'strong') return '#ffffff';
                if (d.strength === 'medium') return '#cccccc';
                return '#999999';
            })
            .attr('stroke-width', d => {
                // Width based on strength
                if (d.strength === 'strong') return 3;
                if (d.strength === 'medium') return 2;
                return 1;
            })
            .attr('fill', 'none')
            .style('opacity', 0.5)
            .style('stroke-dasharray', d => {
                // Dash pattern based on strength
                if (d.strength === 'strong') return 'none';
                if (d.strength === 'medium') return '5,5';
                return '2,8';
            })
            .each(function(d) {
                // Store the original stroke width for animations
                d.originalStrokeWidth = d.strength === 'strong' ? 3 : (d.strength === 'medium' ? 2 : 1);
            });
            
        // Initial positioning of connections
        updateConnections();
        
        // Start the pulse animation for connections
        animateConnections();
    }
    
    // Update connection positions when circles move
    function updateConnections() {
        connectionsGroup.selectAll('.connection')
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
                
                return `M${sourceOffsetX},${sourceOffsetY} Q${midX + perpX},${midY + perpY} ${targetOffsetX},${targetOffsetY}`;
            });
    }
    
    // Animate connections with a pulse effect
    function animateConnections() {
        connectionsGroup.selectAll('.connection')
            .each(function(d) {
                const line = d3.select(this);
                
                // Create a repeating pulse animation
                function pulse() {
                    line.transition()
                        .duration(2000)
                        .style('opacity', 0.8)
                        .style('stroke-width', d.originalStrokeWidth * 1.5)
                        .transition()
                        .duration(2000)
                        .style('opacity', 0.5)
                        .style('stroke-width', d.originalStrokeWidth)
                        .on('end', pulse);
                }
                
                // Start the pulse with a random delay to prevent all lines pulsing together
                setTimeout(pulse, Math.random() * 2000);
            });
    }
    
    // Create the connections after circles are created
    createConnections();

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
        
        // Update connection lines positions
        updateConnections();
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
