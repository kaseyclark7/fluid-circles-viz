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

    // Create SVG container
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create tooltip
    const tooltip = container.append('div')
        .attr('class', 'tooltip');

    // Create circles
    const circles = svg.selectAll('.circle-group')
        .data(circleData)
        .enter()
        .append('g')
        .attr('class', 'circle-group')
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
