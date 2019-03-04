
// today's date
const todayDate = new Date();

// get chart size
const svg = d3.select('#chart');
const chartY = svg.node().getBoundingClientRect().y;
const m = { l: 50, t: 50, r: 50, b: 50 };
const chartW = document.getElementById('chart-col').offsetWidth;
const chartH = window.innerHeight - chartY;
svg
    .style('width',chartW + 'px')
    .style('height',chartH + 'px');

// get sidebar height
const filtersY = d3.select('#content-filters').node().getBoundingClientRect().y;
const filtersH = Math.max(window.innerHeight - filtersY - 60, 20);
d3.select('#content-filters')
    .style('height',`${filtersH}px`);

// get btn height for info btn
const btnH = d3.select('#btn-read').node().getBoundingClientRect().height;
d3.select('#btn-info')
    .style('width',`${btnH}px`)
    .style('height',`${btnH}px`);

// set scales
let obj = {};
obj.xScale = d3.scaleLinear().range([m.l, chartW - (m.l + m.r)]);
obj.yScale = d3.scaleLinear().range([chartH - (m.b + m.t), m.b]);

// other variables
const weightsMax = {
    dog: { small: 15, medium: 50 },
    cat: { small: 6, medium: 12 }
};

const weightMap = new Map();
weightMap.set('small',25);
weightMap.set('medium',37.5);
weightMap.set('large',50);

const heightMap = new Map();
heightMap.set('1',10);
heightMap.set('2',18);
heightMap.set('3',26);
heightMap.set('4',34);
heightMap.set('5',42);

obj.dataFilter = 'available';
obj.howToReadOpen = false;
obj.howToReadStep = 0;

// load data and create chart
d3.csv('./data/pin_data.csv',function(row){
    const adoptionDate = row.adoption_date;
    const adoptedIn = (adoptionDate == '') ? 0 : 1;
    const weightCat = (row.species.toLowerCase() == 'dog') ? ((+row.weight <= weightsMax.dog.small) ? 'small' : (+row.weight <= weightsMax.dog.medium) ? 'medium' : 'large') 
        : ((+row.weight <= weightsMax.cat.small) ? 'small' : (+row.weight <= weightsMax.cat.medium) ? 'medium' : 'large');
    const colorCat = ['white','tan'].includes(row.fur_color.toLowerCase()) ? 'light' : (['grey','brown'].includes(row.fur_color.toLowerCase()) ? 'medium' 
        :   (['black/brown','black'].includes(row.fur_color.toLowerCase()) ? 'dark' : 'multi'));
    return {
        id: row.id,
        name: row.name,
        intake: new Date(row.intake_date),
        adopted: +adoptedIn,
        adoption: new Date(adoptionDate),
        species: row.species,
        gender: ['f','female'].includes(row.gender.toLowerCase()) ? 'female' : 'male',
        dob: new Date(row.approx_date_of_birth),
        weight: +row.weight,
        weightCat: weightCat,
        color: row.fur_color,
        colorCat: colorCat,
        traitExtraSpecies: row.extraversion_towards_same_species,
        traitExtraHumans: row.extraversion_towards_humans,
        traitOpenness: row.openness,
        traitEnergy: row.energy,
        traitAffection: row.affection
    }
}).then(function(data){

    // filter out animals without intake date and with dob after intake date
    // date calculations
    data = data.filter(d => !isNaN(d.intake) && (d.intake.getTime() > d.dob.getTime()));
    data.forEach(function(row){
        row.duration = (row.adopted == 1) ? getMonths(row.intake,row.adoption) : getMonths(row.intake,todayDate);
        row.age = (row.adopted == 1) ? getYears(row.dob,row.adoption) : getYears(row.dob,todayDate);
    });

    const dataAvailable = data.filter(d => d.adopted == 0);
    const dataAdopted = data.filter(d => d.adopted == 1);

    console.log(data);

    // duration scale
    obj.durationMaxAvailable = Math.ceil((d3.max(dataAvailable.map(d => d.duration)))/6) * 6;
    obj.durationMaxAdopted = Math.ceil((d3.max(dataAdopted.map(d => d.duration)))/6) * 6;
    let durationMax = (obj.dataFilter == 'available') ? obj.durationMaxAvailable : obj.durationMaxAdopted;
    obj.xScale.domain([0,durationMax]);

    svg.select('#x-scale')
        .attr('transform', `translate(0,${chartH - m.b - m.t})`)
        .call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(durationMax)));

    svg.append('text')
        .attr('class','axis-label')
        .attr('dy','-0.5em')
        .attr('x',chartW/2)
        .attr('y',chartH-m.b)
        .text('months in shelter');

    // age duration
    obj.ageMaxAvailable = d3.max(dataAvailable.map(d => d.age));
    obj.ageMaxAdopted = d3.max(dataAdopted.map(d => d.age));
    let ageMax = (obj.dataFilter == 'available') ? obj.ageMaxAvailable : obj.ageMaxAdopted;
    obj.yScale.domain([0,Math.ceil(ageMax)]);

    svg.select('#y-scale')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(obj.yScale).ticks(Math.ceil(ageMax)).tickFormat(d3.format('d')));
    
    svg.append('text')
        .attr('class','axis-label')
        .attr('dy','1em')
        .attr('transform', 'rotate(-90)')
        .attr('x',-chartH/2)
        .attr('y',0)
        .text('age (years)');

    // add force
    // const simulation = d3.forceSimulation(data)
    //     .force('x', d3.forceX(d => obj.xScale(d.duration)) /*.strength(1)*/)
    //     .force('y', d3.forceY(d => obj.yScale(d.age)))
    //     .force('collide', d3.forceCollide().radius(10))
    //     .force('manyBody', d3.forceManyBody().strength(-10))
    //     .stop();

    // for (var i = 0; i < 150; ++i) simulation.tick();

    // add animals
    svg.selectAll('portrait')
        .data(data)
        .enter()
        .append('g')
        .attr('id',d => `portrait-${d.id}`)
        .attr('class',d => `portrait ${(d.adopted == 1) ? 'adopted' : 'available'}`)
        .classed('hidden',d => d.adopted == 1)
        .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`)
        .each(function(d){
            createPortrait(d);
        });

    // set up legend elements on page load
    d3.selectAll('.size-background-circle')
        .attr('r',function(){
            let radius;
            thisId = d3.select(this).attr('id');
            if(thisId == 'background-circle-small'){ radius = weightMap.get('small');
            }else if(thisId == 'background-circle-medium'){ radius = weightMap.get('medium');
            }else if(thisId == 'background-circle-large'){ radius = weightMap.get('large');
            }else{ radius = (heightMap.get(`${thisId[thisId.length -1]}`) + 10 -1) * 2 };
            return radius;
        })

    // interations
    svg.on('click',function(){
        console.log('svg clicked');
        // if HTR open, close
        if(d3.select('#btn-read').classed('pin-btn-active')){
            obj.howToReadStep = 0;
            howToRead();

            // enable portrait interactions
            enablePortraitInteractions();
            
            // if animal selected, deselect
        }else if(d3.select('#content-animal-selected').classed('hidden') == false){
            d3.select('#content-animal-selected').classed('hidden',true);
            d3.select('#filter-toggle').classed('hidden',false);
            if(obj.dataFilter == 'available'){
                d3.select('#content-filters').classed('hidden',false);
                d3.select('#sidebar-header').html('ADOPTABLES');
            }else{
                d3.select('#content-success-stories').classed('hidden',false);
                d3.select('#sidebar-header').html('SUCCESS STORIES');
            }
        }

    });

    enablePortraitInteractions();

    d3.select('#filter-toggle')
        .on('click',function(){
            if(obj.dataFilter == 'available'){
                obj.dataFilter = 'adopted';
                d3.select(this).html('view the adoptables');
                d3.select('#sidebar-header').html('SUCCESS STORIES');

                obj.xScale.domain([0,Math.ceil(obj.durationMaxAdopted)]);
                d3.select('#x-scale').call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(obj.durationMaxAdopted)));
                obj.yScale.domain([0,Math.ceil(obj.ageMaxAdopted)]);
                d3.select('#y-scale').call(d3.axisLeft(obj.yScale).ticks(Math.ceil(obj.ageMaxAdopted)).tickFormat(d3.format('d')));

                d3.selectAll('.portrait')
                    .classed('hidden',d => d.adopted == 0)
                    .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);

            }else if(obj.dataFilter == 'adopted'){
                obj.dataFilter = 'available';
                d3.select(this).html('view success stories');
                d3.select('#sidebar-header').html('ADOPTABLES');

                obj.xScale.domain([0,Math.ceil(obj.durationMaxAvailable)]);
                d3.select('#x-scale').call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(obj.durationMaxAvailable)));
                obj.yScale.domain([0,Math.ceil(obj.ageMaxAvailable)]);
                d3.select('#y-scale').call(d3.axisLeft(obj.yScale).ticks(Math.ceil(obj.ageMaxAvailable)).tickFormat(d3.format('d')));

                d3.selectAll('.portrait')
                    .classed('hidden',d => d.adopted == 1)
                    .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);

            }else{
                console.log(`${obj.dataFilter} is not accepted filter value.`)
            }
        })

    d3.select('#filter-clear')
        .on('click',function(){
            d3.selectAll('input[name=filter]').property('checked',false);
        })

    $('#info-modal')
        .on('show.bs.modal',function(){
            d3.select('#btn-info').classed('pin-btn-active',true);
        })
        .on('hidden.bs.modal',function(){
            d3.select('#btn-info').classed('pin-btn-active',false);
        })

    d3.select('#btn-read')
        .on('click',function(){
            if(d3.select(this).classed('pin-btn-active')){
                obj.howToReadStep = 0;
                howToRead();

                // enable portrait interactions
                enablePortraitInteractions();

            }else{
                d3.select(this).classed('pin-btn-active',true);
                d3.select('#g-legend').classed('hidden',false);
                obj.howToReadStep = 1;

                // select portrait with max duration
                let maxDur, maxObj;
                if(obj.dataFilter == 'available'){
                    maxDur = d3.max(dataAvailable.map(d => d.duration));
                    maxObj = dataAvailable.find(d => d.duration == maxDur);
                }else{
                    maxDur = d3.max(dataAdopted.map(d => d.duration));
                    maxObj = dataAdopted.find(d => d.duration == maxDur);
                }
                obj.animalMax = maxObj;
                setUpLegend();
                howToRead('forward');

                // disable portrait interactions
                svg.selectAll('.portrait')
                    .style('cursor','default')
                    .on('mouseenter',function(d){
                        // do nothing
                    })
                    .on('mouseleave',function(d){
                        // do nothing
                    })
                    .on('click',function(d){
                        // do nothing
                    });
            }
        })

    d3.select('#link-prev')
        .on('click',function(){
            if([2,3].includes(obj.howToReadStep)){
                obj.howToReadStep--;
                howToRead('backward');
            }
        })

    d3.select('#link-next')
        .on('click',function(){
            if([1,2].includes(obj.howToReadStep)){
                obj.howToReadStep++;
                howToRead('forward');
            }else if(obj.howToReadStep == 3){
                obj.howToReadStep = 0;
                howToRead();
            }
        })
})

function getDays(intakeDate,endDate){
    const distance = endDate.getTime() - intakeDate.getTime();
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    return days;
}

function getMonths(intakeDate,endDate){
    const distance = endDate.getTime() - intakeDate.getTime();
    const months = distance / (1000 * 60 * 60 * 24 * 7 * 4);
    return +months.toFixed(2);
}

function getYears(date,endDate){
    const years = endDate.getFullYear() - date.getFullYear(); // get age in years
    const monthsDelta = endDate.getMonth() - date.getMonth();
    const age = years + (monthsDelta / 12); // incorporate months to age (CHECK IF ACCURATE)
    return +age.toFixed(2);
}

function xAxisTicks(max){
    let i = 0,
    ticksArr = [];
    while(i <= max){
        ticksArr.push(i);
        if(max > 6){
            i += 6;
        }else{
            i+= 2;
        }
    }
    return ticksArr;
}

function createPortrait(data){
    const element = d3.select(`#portrait-${data.id}`);

    // watercolor background
    const randomNum = Math.floor(Math.random()*6) + 1;

    element.append('svg:image')
        .attr('xlink:href',d => `./assets/watercolor/${d.colorCat}/Watercolor ${randomNum}.png`)
        .attr('class','watercolor')
        .attr('x',-weightMap.get(data.weightCat)/2)
        .attr('y',-weightMap.get(data.weightCat)/2)
        .attr('width',weightMap.get(data.weightCat))
        .attr('height',weightMap.get(data.weightCat));

    // center circle: species
    element.append('circle')
        // .attr('class',(data.species.toLowerCase() == 'dog') ? 'species dog' : 'species cat')
        .attr('class',`species ${data.species.toLowerCase()}`)
        .attr('cx',0)
        .attr('cy',0)
        .attr('r',5);

    // outer circle
    element.append('circle')
        .attr('class','outer-circle')
        .attr('cx',0)
        .attr('cy',0)
        .attr('r',10);

    // supporting lines: gender
    let i;
    for(i = 0; i < 5; i++){
        element.append('line')
            .attr('class',`gender ${data.gender.toLowerCase()}`)
            .attr('x1',0)
            .attr('x2',0)
            .attr('y1',0)
            .attr('y2',-15); // max watercolor size
    }
    element.selectAll('.gender')
        .attr('transform',function(d,i){
            // get x and y of rotation
            const degrees = ((72*i)+15+(72/2));
            const radians = ((degrees * Math.PI) / 180) - (Math.PI/2);
            const x = 10 * Math.cos(radians);
            const y = 10 * Math.sin(radians);
            return `translate(${x},${y}) rotate(${degrees} ${0} ${0})`;
        })

    // personality trait 1: 
    element.append('svg:image')
        .attr('xlink:href',d => `./assets/personality-rays/level-${d.traitExtraSpecies}.svg`)
        .attr('class','trait-ray trait-species');

    // personality trait 2: 
    element.append('svg:image')
        .attr('xlink:href',d => `./assets/personality-rays/level-${d.traitExtraHumans}.svg`)
        .attr('class','trait-ray trait-humans');

    // personality trait 3: 
    element.append('svg:image')
        .attr('xlink:href',d => `./assets/personality-rays/level-${d.traitEnergy}.svg`)
        .attr('class','trait-ray trait-energy');

    // personality trait 4: 
    element.append('svg:image')
        .attr('xlink:href',d => `./assets/personality-rays/level-${d.traitOpenness}.svg`)
        .attr('class','trait-ray trait-open');

    // personality trait 5: 
    element.append('svg:image')
        .attr('xlink:href',d => `./assets/personality-rays/level-${d.traitAffection}.svg`)
        .attr('class','trait-ray trait-affection');

    element.selectAll('.trait-ray')
        .attr('x',0)
        .attr('y',0)
        .attr('transform',function(d,i){
            // get width and height of element
            const w = 8;
            let h = (d3.select(this).classed('trait-species')) ? heightMap.get(d.traitExtraSpecies) 
                : ((d3.select(this).classed('trait-humans')) ? heightMap.get(d.traitExtraHumans) 
                : ((d3.select(this).classed('trait-energy')) ? heightMap.get(d.traitEnergy) 
                : ((d3.select(this).classed('trait-open')) ? heightMap.get(d.traitOpenness) 
                : heightMap.get(d.traitAffection))));
            if (typeof h == 'undefined'){
                h = 0;
            }
            // d3.select(this).node().getBBox().height; // 10 18 26 34 42
            // get x and y of rotation
            const degrees = ((72*i)+15);
            const radians = ((degrees * Math.PI) / 180) - (Math.PI/2);
            const x = 9 * Math.cos(radians);
            const y = 9 * Math.sin(radians);
            return `translate(${x-(w/2)},${y-h}) rotate(${degrees} ${w/2} ${h})`;
        });

}

function howToRead(direction){
    if(obj.howToReadStep == 1){

        // legend elements
        d3.selectAll('.htr-1').classed('hidden',false);
        d3.selectAll('.htr-2').classed('hidden',true);
        d3.selectAll('.htr-3').classed('hidden',true);

        if(direction == 'forward'){
            // sidebar
            d3.select('#content-filters')
                .classed('hidden',true);
            d3.select('#content-how-to-read')
                .classed('hidden',false);
            d3.select('#link-next')
                .html('next →&nbsp;');
            d3.selectAll('.span-name')
                .html(`${obj.animalMax.name}`);
            d3.select('#span-age')
                .html(`${obj.animalMax.age.toFixed(1)}`);
            d3.select('#span-duration')
                .html(`${obj.animalMax.duration.toFixed(0)}`);
            d3.select('#span-size')
                .html(`${obj.animalMax.weightCat}`);
            d3.select('#span-color')
                .html(`${obj.animalMax.colorCat}`);
            d3.select('#span-species')
                .html(`${obj.animalMax.species.toLowerCase()}`);
            d3.select('#span-gender')
                .html(`${obj.animalMax.gender.toLowerCase()}`);

            // calculate paragraph heights
            let maxHeight = 0;
            d3.selectAll('.step')
                .each(function(){
                    const pHeight = d3.select(this).node().getBoundingClientRect().height;
                    if(pHeight > maxHeight){
                        maxHeight = pHeight;
                    }
                })
                .style('height',`${Math.ceil(maxHeight)}px`);

            // update chart
            d3.selectAll(`.${obj.dataFilter}`)
                .transition()
                .style('opacity',d => (d.id == obj.animalMax.id) ? 1 : 0.4);

            // add axis text and lines to chart
            // const svgNode = d3.select('#chart').node().getBoundingClientRect();
            // const textAxisY = d3.select('#y-scale').select('.tick').select('text').node().getBoundingClientRect();
            // const textAgeX = textAxisY.x + textAxisY.width - svgNode.x;
            // const textDurY = d3.select('#x-scale').select('.tick').select('text').node().getBoundingClientRect().y - svgNode.y;
            d3.select('#g-legend')
                .attr('transform',`translate(${obj.xScale(obj.animalMax.duration)},${obj.yScale(obj.animalMax.age)})`);
            d3.select('#text-age')
                .attr('x',-(obj.xScale(obj.animalMax.duration)-m.l+12))
                .attr('y',0)
                .attr('dy','0.32em') // manual adjustment
                .text(obj.animalMax.age.toFixed(1));
            d3.select('#text-duration')
                .attr('x',0)
                .attr('y',chartH - m.b - m.t - obj.yScale(obj.animalMax.age) + 9)
                .attr('dy','0.71em') // manual adjustment
                .text(obj.animalMax.duration.toFixed(0));
        }else{
            // transform scales and portraits
            let durationMax = (obj.dataFilter == 'available') ? obj.durationMaxAvailable : obj.durationMaxAdopted;
            let ageMax = (obj.dataFilter == 'available') ? obj.ageMaxAvailable : obj.ageMaxAdopted;
            obj.xScale.domain([0,durationMax]);
            obj.yScale.domain([0,Math.ceil(ageMax)]);
            d3.select('#x-scale')
                .transition()
                .call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(durationMax)));
            d3.select('#y-scale')
                .transition()
                .call(d3.axisLeft(obj.yScale).ticks(Math.ceil(ageMax)).tickFormat(d3.format('d')));
            d3.selectAll(`.${obj.dataFilter}`)
                .transition()
                .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);
            d3.select('#g-legend')
                .transition()
                .attr('transform',`translate(${obj.xScale(obj.animalMax.duration)},${obj.yScale(obj.animalMax.age)})`);
            d3.select('#text-age')
                .transition()
                .attr('x',-(obj.xScale(obj.animalMax.duration)-m.l+12));
            d3.select('#text-duration')
                .transition()
                .attr('y',chartH - m.b - m.t - obj.yScale(obj.animalMax.age) + 9);
        }

        // update sidebar -- moved after so paragraph heights could be accurately calculated
        d3.selectAll('.step')
            .classed('hidden', function(){
                const thisId = d3.select(this).attr('id');
                return (thisId == `step-${obj.howToReadStep}`) ? false : true;
            });
        d3.select('#link-prev')
            .classed('link-disabled',true);
        
    }else if(obj.howToReadStep == 2){
        d3.selectAll('.htr-1').classed('hidden',false);
        d3.selectAll('.htr-2').classed('hidden',false);
        d3.selectAll('.htr-3').classed('hidden',true);

        // update sidebar
        d3.selectAll('.step')
            .classed('hidden', function(){
                const thisId = d3.select(this).attr('id');
                return (thisId == `step-${obj.howToReadStep}`) ? false : true;
            });
        d3.select('#link-prev')
            .classed('link-disabled',false);

        if(direction == 'forward'){
            // transform axis and portraits
            obj.xScale.domain([obj.animalMax.duration-2,obj.animalMax.duration+2]);
            obj.yScale.domain([obj.animalMax.age-1,obj.animalMax.age+1]);
            d3.select('#x-scale')
                .transition()
                .call(d3.axisBottom(obj.xScale).ticks(4).tickFormat(d3.format('d')));
            d3.select('#y-scale')
                .transition()
                .call(d3.axisLeft(obj.yScale).ticks(2).tickFormat(d3.format('d')));
            d3.selectAll(`.${obj.dataFilter}`)
                .transition()
                .attr('transform',d => (d.id == obj.animalMax.id) ? `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)}) scale(2)`
                : `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);

            // legend
            d3.select('#g-legend')
                .transition()
                .attr('transform',`translate(${obj.xScale(obj.animalMax.duration)},${obj.yScale(obj.animalMax.age)})`);
            d3.select('#text-age')
                .transition()
                .attr('x',-(obj.xScale(obj.animalMax.duration)-m.l+12));
            d3.select('#text-duration')
                .transition()
                .attr('y',chartH - m.b - m.t - obj.yScale(obj.animalMax.age) + 9);
            d3.selectAll('.htr-2')
                .style('opacity',0)
                .transition()
                .delay(250)
                .style('opacity',1);
        }else{
            d3.select('#link-next').html('next →&nbsp;');
        }
    }else if(obj.howToReadStep == 3){
        d3.selectAll('.htr-2').classed('hidden',true);
        d3.selectAll('.htr-3').classed('hidden',false);

        d3.selectAll('.step')
            .classed('hidden', function(){
                const thisId = d3.select(this).attr('id');
                return (thisId == `step-${obj.howToReadStep}`) ? false : true;
            });
        d3.select('#link-next').html('done');
        

    }else if(obj.howToReadStep == 0){
        d3.select('#btn-read').classed('pin-btn-active',false);
        d3.select('#g-legend').classed('hidden',true);

        // update sidebar
        if(obj.dataFilter == 'available'){
            d3.select('#content-filters').classed('hidden',false);
        }else{
            d3.select('#content-success-stories').classed('hidden',false);
        }
        d3.select('#content-how-to-read').classed('hidden',true);

        // reset axes and portraits
        let durationMax = (obj.dataFilter == 'available') ? obj.durationMaxAvailable : obj.durationMaxAdopted;
        let ageMax = (obj.dataFilter == 'available') ? obj.ageMaxAvailable : obj.ageMaxAdopted;
        obj.xScale.domain([0,durationMax]);
        obj.yScale.domain([0,Math.ceil(ageMax)]);
        d3.select('#x-scale')
            .transition()
            .call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(durationMax)));
        d3.select('#y-scale')
            .transition()
            .call(d3.axisLeft(obj.yScale).ticks(Math.ceil(ageMax)).tickFormat(d3.format('d')));
        d3.selectAll(`.${obj.dataFilter}`)
            .transition()
            .style('opacity',1)
            .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);
    }
}

function setUpLegend(){
    d3.select('#g-legend')
        .attr('transform',`translate(${obj.xScale(obj.animalMax.duration)},${obj.yScale(obj.animalMax.age)})`);
    d3.select('#g-size-legend')
        .attr('transform','translate(-200,-30)');
    d3.select('#g-color')
        .attr('transform','translate(-200,10)');
    d3.select('#g-species')
        .attr('transform','translate(120,-30)');
    d3.select('#g-gender')
        .attr('transform','translate(120,20)');

    d3.selectAll('.size-legend-circle')
        .classed('size-legend-circle-active',function(){
            let active;
            thisId = d3.select(this).attr('id');
            if(thisId == 'legend-circle-small'){
                active = (obj.animalMax.weightCat == 'small') ? true : false;
            }else if(thisId == 'legend-circle-medium'){
                active = (obj.animalMax.weightCat == 'medium') ? true : false;
            }else{
                active = (obj.animalMax.weightCat == 'large') ? true : false;
            }
            return active;
    })
    d3.select('#g-species').selectAll('.legend-text')
        .classed('bold', function(){
            const id = d3.select(this).html();
            return (obj.animalMax.species.toLowerCase() == id) ? true : false;
        });

    d3.select('#g-gender').selectAll('.legend-text')
        .classed('bold', function(){
            const id = d3.select(this).html();
            return (obj.animalMax.gender.toLowerCase() == id) ? true : false;
        });

    d3.selectAll('.g-trait')
        .each(function(d,i){
            const degrees = ((72*i)+15);
            const radians = ((degrees * Math.PI) / 180) - (Math.PI/2);
            const radius = (heightMap.get('5') + 10) * 2
            const x = (radius + 10) * Math.cos(radians);
            const y = (radius + 10) * Math.sin(radians);
            d3.select(this).attr('transform',`translate(${x},${y})`);
        })
}

function activateTooltip(data){
    const tooltip = d3.select('#tooltip');
    // display tooltip
    tooltip.classed('hidden',false);

    // trait descriptions

    // position tooltip
    const tooltipNode = tooltip.node().getBoundingClientRect();
    const portraitNode = d3.select(`#portrait-${data.id}`).node().getBoundingClientRect();
    const portraitCY = d3.select(`#portrait-${data.id}`).select('.species').node().getBoundingClientRect().y + 5;
    const portraitCX = d3.select(`#portrait-${data.id}`).select('.species').node().getBoundingClientRect().x + 5;
    const svgNode = d3.select('#chart').node().getBoundingClientRect();
    const svgCX = svgNode.x + (svgNode.width/2);
    const svgCY = svgNode.y + (svgNode.height/2);
    const tooltipDelta = window.innerHeight - (portraitCY-35+tooltipNode.height);

    tooltip
        .style('left', (portraitCX < svgCX) ? (portraitNode.x + portraitNode.width + 20) +'px' : (portraitNode.x - 20 - 225) +'px')
        .style('top', (tooltipDelta > 0) ? (portraitCY-35)+'px' : (portraitCY-35+tooltipDelta)+'px');

    d3.select('#tooltip-arrow')
        .classed('arrow-right', (portraitCX < svgCX) ? false : true)
        .classed('arrow-left', (portraitCX < svgCX) ? true : false)
        .style('top', (portraitCY-10)+'px')
        .style('left', (portraitCX < svgCX) ? (portraitNode.x + portraitNode.width + 10) +'px' : (portraitNode.x - 20) +'px')

    // populate content
    tooltip.select('#tooltip-name').html(data.name);
    // dog versus cat icon
    tooltip.select('#icon-extraSpecies')
        .attr('src', `./assets/icons/${data.species}.svg`);

    // demographic svgs
    tooltip.select('#demo-desc-species').select('circle')
        .classed('dog', (data.species.toLowerCase() == 'dog') ? true : false);
    tooltip.select('#demo-desc-gender').select('line')
        .classed('female', (data.gender.toLowerCase() == 'female') ? true : false);
    tooltip.select('#demo-desc-size').selectAll('circle')
        .classed('tooltip-size-active',function(){
            const id = d3.select(this).attr('id');
            return (id == data.weightCat) ? true : false;
        });

    // demographic text
    tooltip.select('#demo-desc-species').select('p')
        .html(data.species.toLowerCase());
    tooltip.select('#demo-desc-gender').select('p')
        .html(data.gender.toLowerCase());
    tooltip.select('#demo-desc-size').select('p')
        .html(`${data.weightCat}-sized`);
    tooltip.select('#demo-desc-color').select('p')
        .html(`${data.colorCat}-colored`);

}

function enablePortraitInteractions(){
    svg.selectAll('.portrait')
        .style('cursor','pointer')
        .on('mouseenter',function(d){
            activateTooltip(d);
        })
        .on('mouseleave',function(d){
            d3.select('#tooltip').classed('hidden',true);
            d3.select('#tooltip-arrow')
                .classed('arrow-right', false)
                .classed('arrow-left', false);
        })
        .on('click',function(d){
            console.log(d);
            const name = d.name.toUpperCase();
            d3.select('#sidebar-header').html(`${name}`);
            d3.select('#content-animal-selected').classed('hidden',false);
            d3.select('#filter-toggle').classed('hidden',true);
            d3.select('#content-filters').classed('hidden',true);
        });
}