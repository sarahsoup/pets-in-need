// splash page buttons
d3.select('#btn-adopt')
    .on('click',function(){
        d3.select('#splash').classed('hidden',true);
    })

d3.select('#btn-ss')
    .on('click',function(){
        d3.select('#splash').classed('hidden',true);
        obj.dataFilter = 'adopted';
        d3.select('#filter-toggle').html('view the adoptables');
        d3.select('#sidebar-header').html('SUCCESS STORIES');
        d3.select('#content-filters').classed('hidden',true);
        d3.select('#content-success-stories').classed('hidden',false);

        obj.xScale.domain([0,Math.ceil(obj.durationMaxAdopted)]);
        d3.select('#x-scale').call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(obj.durationMaxAdopted)));
        obj.yScale.domain([0,Math.ceil(obj.ageMaxAdopted)]);
        d3.select('#y-scale').call(d3.axisLeft(obj.yScale).ticks(Math.ceil(obj.ageMaxAdopted)).tickFormat(d3.format('d')));

        d3.selectAll('.portrait')
            .classed('hidden',d => d.adopted == 0)
            .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);
    })

// today's date
const todayDate = new Date();

// chart variables
const svg = d3.select('#chart');
const padding = 15 * 2; // designated by bootstrap

let obj = {};
obj.xScale = d3.scaleLinear();
obj.yScale = d3.scaleLinear();
// obj.m = { l: 50, t: 50, r: 50, b: 80 };

// other variables
const dimmed = 0.3;

const weightsMax = {
    dog: { small: 15, medium: 50 },
    cat: { small: 6, medium: 12 }
};

const weightMap = new Map();
weightMap.set('small',20 + 2); // was 25 + 6
weightMap.set('medium',35 + 2); // was 37.5 + 6
weightMap.set('large',50 + 2);

const rayUnits = 8;

// map for sliced rays
const ray = { w: 8, offset: 1};
const heightMap = new Map();
heightMap.set('1',10);
heightMap.set('2',18);
heightMap.set('3',26);
heightMap.set('4',34);
heightMap.set('5',42);

// map for tooltip traits scale
const scaleMap = new Map();
scaleMap.set('1','0%');
scaleMap.set('2','25%');
scaleMap.set('3','50%');
scaleMap.set('4','75%');
scaleMap.set('5','100%');

// map for info modal: last date editted
const monthMap = new Map();
monthMap.set('0','January');
monthMap.set('1','February');
monthMap.set('2','March');
monthMap.set('3','April');
monthMap.set('4','May');
monthMap.set('5','June');
monthMap.set('6','July');
monthMap.set('7','August');
monthMap.set('8','September');
monthMap.set('9','October');
monthMap.set('10','November');
monthMap.set('11','December');

// other variables
obj.dataFilter = 'available';
obj.howToReadOpen = false;
obj.howToReadStep = 0;
obj.isMobile = 0;
obj.isMLandscape = 0;
obj.sidebarClosed = 1;
obj.firstPortrait = 1;
obj.firstHTR = 1;

// create sliders
const sliderSpecies = document.getElementById('slider-species');
const sliderHumans = document.getElementById('slider-humans');
const sliderEnergy = document.getElementById('slider-energy');
const sliderOpenness = document.getElementById('slider-openness');
const sliderAffection = document.getElementById('slider-affection');

noUiSlider.create(sliderSpecies, {
    range: { 'min': 1, 'max': 5 },
    step: 1,
    start: [1, 5],
    connect: true
});

noUiSlider.create(sliderHumans, {
    range: { 'min': 1, 'max': 5 },
    step: 1,
    start: [1, 5],
    connect: true
});

noUiSlider.create(sliderEnergy, {
    range: { 'min': 1, 'max': 5 },
    step: 1,
    start: [1, 5],
    connect: true
});

noUiSlider.create(sliderOpenness, {
    range: { 'min': 1, 'max': 5 },
    step: 1,
    start: [1, 5],
    connect: true
});

noUiSlider.create(sliderAffection, {
    range: { 'min': 1, 'max': 5 },
    step: 1,
    start: [1, 5],
    connect: true
});

sliderSpecies.noUiSlider.on('update', filterSpecies);
sliderHumans.noUiSlider.on('update', filterHumans);
sliderEnergy.noUiSlider.on('update', filterEnergy);
sliderOpenness.noUiSlider.on('update', filterOpenness);
sliderAffection.noUiSlider.on('update', filterAffection);

d3.select('#filter-dogs')
    .on('click',function(){
        filter('dog');
    });

d3.select('#filter-cats')
    .on('click',function(){
        filter('cat');
    });

// load data and create chart
d3.csv('./assets/data/pin_data.csv',function(row){
    const adoptionDate = row.adoption_date;
    const adoptedIn = (adoptionDate == '') ? 0 : 1;
    const weightCat = (row.species.toLowerCase() == 'dog') ? ((+row.weight <= weightsMax.dog.small) ? 'small' : (+row.weight <= weightsMax.dog.medium) ? 'medium' : 'large') 
        : ((+row.weight <= weightsMax.cat.small) ? 'small' : (+row.weight <= weightsMax.cat.medium) ? 'medium' : 'large');
    const colorCat = ['white','tan'].includes(row.fur_color.toLowerCase()) ? 'light' : (['grey','brown'].includes(row.fur_color.toLowerCase()) ? 'medium' 
        :   (['black/brown','black'].includes(row.fur_color.toLowerCase()) ? 'dark' : 'multi'));
    return {
        lastEdited: new Date(row.last_edited),
        id: row.id,
        name: row.name,
        intake: new Date(row.intake_date),
        adopted: +adoptedIn,
        adoption: new Date(adoptionDate),
        species: row.species.toLowerCase(),
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
        traitAffection: row.affection,
        description: row.description.substring(1,row.description.length-1),
        visible: ['y','yes'].includes(row.make_visible.toLowerCase()) ? 1 : 0
    }
}).then(function(data){

    // filter out animals without intake date and with dob after intake date
    data = data.filter(d => !isNaN(d.intake) && (d.intake.getTime() > d.dob.getTime()));
    // filter now those manually determined to not show
    data = data.filter(d => d.visible == 1);

    // determine stay duration and age
    data.forEach(function(row){
        row.duration = (row.adopted == 1) ? getMonths(row.intake,row.adoption) : getMonths(row.intake,todayDate);
        row.age = (row.adopted == 1) ? getYears(row.dob,row.adoption) : getYears(row.dob,todayDate);
    });

    // data subsets
    const dataAvailable = data.filter(d => d.adopted == 0);
    const dataAdopted = data.filter(d => d.adopted == 1);


    ////////// AXES //////////

    // duration scale
    obj.durationMaxAvailable = Math.ceil((d3.max(dataAvailable.map(d => d.duration)))/6) * 6;
    obj.durationMaxAdopted = Math.ceil((d3.max(dataAdopted.map(d => d.duration)))/6) * 6;
    obj.durationMax = (obj.dataFilter == 'available') ? obj.durationMaxAvailable : obj.durationMaxAdopted;
    obj.xScale.domain([0,obj.durationMax]);

    svg.append('text')
        .attr('id','axis-label-x')
        .attr('class','axis-label')
        .attr('dy','3.65em')
        .text('months in shelter');

    // age scale
    obj.ageMaxAvailable = d3.max(dataAvailable.map(d => d.age));
    obj.ageMaxAdopted = d3.max(dataAdopted.map(d => d.age));
    obj.ageMax = (obj.dataFilter == 'available') ? obj.ageMaxAvailable : obj.ageMaxAdopted;
    obj.yScale.domain([0,Math.ceil(obj.ageMax)]);
    
    svg.append('text')
        .attr('id','axis-label-y')
        .attr('class','axis-label')
        .attr('dy','1em')
        .attr('transform', 'rotate(-90)')
        .text('age (years)');


    ////////// DATA PORTRAITS //////////

    // add animals
    svg.selectAll('portrait')
        .data(data)
        .enter()
        .append('g')
        .attr('id',d => `portrait-${d.id}`)
        .attr('class',d => `portrait ${(d.adopted == 1) ? 'adopted' : 'available'}`)
        .classed('hidden',d => d.adopted == 1)
        .each(function(d){
            createPortrait(d);
        });

    // size all elements
    resize();

    // set up some additional elements on page load
    d3.select('#tooltip-icons').selectAll('.icon-container')
        .each(function(d,i){
            const width12 = d3.select(this).classed('width-12');
            let yoffset = 0, 
                xoffset = 0;
            if(width12 == true){
                xoffset = -6;
                yoffset = -6;
            }else{
                xoffset = -4;
                yoffset = -7; 
            }
            const degrees = ((72*i)+15);
            const radians = ((degrees * Math.PI) / 180) - (Math.PI/2);
            const radius = ((5 * rayUnits) + 10);
            const x = (radius + 5 - xoffset) * Math.cos(radians);
            const y = (radius + 5 - yoffset) * Math.sin(radians);

            d3.select(this)
                .style('top',`${y+(yoffset*2)}px`)
                .style('left',`${x+xoffset}px`);
        })

    const fileDate = d3.max(data, d => d.lastEdited);
    const fileMonth = fileDate.getMonth().toString();
    d3.select('#span-file-date')
        .html(`${monthMap.get(fileMonth)} ${fileDate.getDate()}, ${fileDate.getFullYear()}`);
    

    ////////// INTERACTIONS //////////

    enablePortraitInteractions();
    
    svg.select('#background')
        .on('click',function(){
            deselect();
        });

    d3.select('#filter-toggle')
        .on('click',function(){
            deselect();
            if(obj.dataFilter == 'available'){
                obj.dataFilter = 'adopted';
                d3.select(this).html('view the adoptables');
                d3.select('#sidebar-header').html('SUCCESS STORIES');
                d3.select('#content-filters').classed('hidden',true);
                d3.select('#content-success-stories').classed('hidden',false);

                obj.xScale.domain([0,Math.ceil(obj.durationMaxAdopted)]);
                d3.select('#x-scale').call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(obj.durationMaxAdopted)));
                obj.yScale.domain([0,Math.ceil(obj.ageMaxAdopted)]);
                d3.select('#y-scale').call(d3.axisLeft(obj.yScale).ticks(Math.ceil(obj.ageMaxAdopted)).tickFormat(d3.format('d')));

                d3.selectAll('.portrait')
                    .classed('hidden',d => d.adopted == 0)
                    .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);
                    
                d3.select('#no-match').classed('hidden',true);

            }else if(obj.dataFilter == 'adopted'){
                obj.dataFilter = 'available';
                d3.select(this).html('view success stories');
                d3.select('#sidebar-header').html('ADOPTABLES');
                d3.select('#content-filters').classed('hidden',false);
                d3.select('#content-success-stories').classed('hidden',true);

                obj.xScale.domain([0,Math.ceil(obj.durationMaxAvailable)]);
                d3.select('#x-scale').call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(obj.durationMaxAvailable)));
                obj.yScale.domain([0,Math.ceil(obj.ageMaxAvailable)]);
                d3.select('#y-scale').call(d3.axisLeft(obj.yScale).ticks(Math.ceil(obj.ageMaxAvailable)).tickFormat(d3.format('d')));

                d3.selectAll('.portrait')
                    .classed('hidden',function(d){
                        let hidden = true;
                        const adopted = (d.adopted == 1) ? true : false;
                        const hiddenSpecies = d3.select(this).classed('hidden-bySpecies');
                        const hiddenTraitSpecies = d3.select(this).classed('hidden-bytraitSpecies');
                        const hiddenTraitHumans = d3.select(this).classed('hidden-bytraitHumans');
                        const hiddenTraitEnergy = d3.select(this).classed('hidden-bytraitEnergy');
                        const hiddenTraitOpenness = d3.select(this).classed('hidden-bytraitOpenness');
                        const hiddenTraitAffection = d3.select(this).classed('hidden-bytraitAffection');
                        if(adopted || hiddenSpecies || hiddenTraitSpecies || hiddenTraitHumans || hiddenTraitEnergy || hiddenTraitOpenness || hiddenTraitAffection){

                        }else{
                            hidden = false;
                        }
                        return hidden;
                    })
                    .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);

            }else{
                console.log(`${obj.dataFilter} is not accepted filter value.`)
            }
        })

    d3.select('#filter-clear')
        .on('click',function(){
            d3.selectAll('.radio-inner').classed('clicked',true);
            sliderSpecies.noUiSlider.reset();
            sliderHumans.noUiSlider.reset();
            sliderEnergy.noUiSlider.reset();
            sliderOpenness.noUiSlider.reset();
            sliderAffection.noUiSlider.reset();
            d3.select('#no-match').classed('hidden',true);
            d3.selectAll('.available')
                .classed('hidden',false)
                .classed('hidden-bySpecies',false)
                .classed('hidden-bytraitSpecies',false)
                .classed('hidden-bytraitHumans',false)
                .classed('hidden-bytraitEnergy',false)
                .classed('hidden-bytraitOpenness',false)
                .classed('hidden-bytraitAffection',false);
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
                deselect();
            }else{
                deselect();
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

    d3.selectAll('.link-prev')
        .on('click',function(){
            if([2,3].includes(obj.howToReadStep)){
                obj.howToReadStep--;
                howToRead('backward');
            }
        })

    d3.selectAll('.link-next')
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

window.addEventListener('resize', resize);


////////// FUNCTIONS //////////

function resize() {

    deselect();

    // position lines on splash page
    const header = d3.select('#splash').select('.acumin-cond').node().getBoundingClientRect();
    const col = d3.select('#splash').select('.col-10').node().getBoundingClientRect();
    const lineW = d3.select('#splash-line-container').node().getBoundingClientRect().width;
    d3.select('#splash-line-container')
        .style('position','absolute')
        .style('top',((header.height*0.55))+'px')
        .style('left',((col.width/2)-(lineW/2)-15)+'px')
        .selectAll('div')
        .classed('splash-line',true);

    // check if mobile
    if(window.innerWidth < 576){
        obj.isMobile = 1;
        obj.isMLandscape = 0;
        d3.select('#sidebar-toggle').classed('hidden',false);

        // sidebar
        const sidebar = d3.select('#sidebar');
        const sidebarW = sidebar.node().getBoundingClientRect().width;

        if(obj.sidebarClosed == 1){
            sidebar.style('left',`-${sidebarW-20}px`);
            d3.select('#sidebar-toggle').style('left','20px');
        }else{
            sidebar.style('left',`0px`);
            d3.select('#sidebar-toggle').style('left',`${sidebarW}px`);
        }

        d3.select('#sidebar-toggle')
            .on('click',function(){
                if(obj.sidebarClosed == 1){
                    // open sidebar
                    obj.sidebarClosed = 0;
                    sidebar.transition().style('left',`0px`);
                    d3.select('#sidebar-toggle').transition().style('left',`${sidebarW}px`);
                    d3.select('#sidebar-toggle').select('i').transition().style('transform','rotate(180deg)');
                    d3.select('#sidebar-toggle').select('i').classed('animate',false);
                    d3.select('#sidebar-tooltip').classed('hidden',true);
                    d3.select('#tooltip-arrow').classed('hidden',true);
                }else{
                    // close sidebar
                    obj.sidebarClosed = 1;
                    sidebar.transition().style('left',`-${sidebarW-20}px`);
                    d3.select('#sidebar-toggle').transition().style('left','20px');
                    d3.select('#sidebar-toggle').select('i').transition().style('transform','rotate(0deg)');
                }
            })
        
        //chart
        obj.m = { l: 40, t: 40, r: 20, b: 60 };

        // sidebar
        sidebar.style('height',`${window.innerHeight}px`);

    }else if(window.innerWidth < 768){
        obj.isMobile = 0;
        obj.isMLandscape = 1;
        d3.select('#sidebar').style('left','0px');
        d3.select('#sidebar-toggle').classed('hidden',true);
        obj.m = { l: 40, t: 40, r: 20, b: 60 };

    }else{
        obj.isMobile = 0;
        obj.isMLandscape = 0;
        d3.select('#sidebar').style('left','0px');
        d3.select('#sidebar-toggle').classed('hidden',true);
        obj.m = { l: 50, t: 50, r: 50, b: 80 };
    }

    // mobile specific
    const sidebarHeadW = d3.select('#sidebar').select('.head').node().getBoundingClientRect().width - 30;
    d3.select('#proj-name-sidebar').html((obj.isMobile == 1 || obj.isMLandscape == 1 || sidebarHeadW < 240) ? 'w & w' : 'worthy & waiting');

    // get btn height for info btn
    const btnH = d3.select('#btn-read').node().getBoundingClientRect().height;
    d3.select('#btn-info')
        .style('width',`${btnH}px`)
        .style('height',`${btnH}px`);

    // resize sidebar height
    const filtersY = d3.select('#content-filters').node().getBoundingClientRect().y;
    const filtersH = (obj.isMLandscape == 1) ? Math.max(window.innerHeight - filtersY - 20, 20) : Math.max(window.innerHeight - filtersY - 60, 20);
    d3.select('#content-filters')
        .style('height',`${filtersH}px`);
    d3.select('#content-success-stories')
        .style('height',`${filtersH}px`);
    d3.select('#content-how-to-read')
        .style('height',`${filtersH}px`);

    // resize svg
    const chartY = svg.node().getBoundingClientRect().y;
    obj.chartW = document.getElementById('chart-col').offsetWidth - padding;
    obj.chartH = window.innerHeight - chartY;

    svg
        .style('width',obj.chartW + 'px')
        .style('height',obj.chartH + 'px');

    svg.select('#background')
        .attr('width',obj.chartW)
        .attr('height',obj.chartH);

    d3.selectAll('.no-match')
        .attr('x',((obj.chartW - obj.m.l - obj.m.r)/2) + obj.m.l)
        .attr('y',obj.chartH/2);

    // resize axes + labels
    obj.xScale.range([obj.m.l, obj.chartW - (/*obj.m.l +*/ obj.m.r)]);
    obj.yScale.range([obj.chartH - (/*obj.m.b +*/ obj.m.b), obj.m.t]);

    svg.select('#x-scale')
        .attr('transform', `translate(0,${obj.chartH /*- obj.m.b*/ - obj.m.b})`)
        .call(d3.axisBottom(obj.xScale).tickValues(xAxisTicks(obj.durationMax)));

    svg.select('#axis-label-x')
        .attr('x',((obj.chartW-obj.m.r-obj.m.l)/2) + obj.m.l )
        .attr('y',obj.chartH-obj.m.b);

    svg.select('#y-scale')
        .attr('transform', `translate(${obj.m.l},0)`)
        .call(d3.axisLeft(obj.yScale).ticks(Math.ceil(obj.ageMax)).tickFormat(d3.format('d')));
    
    svg.select('#axis-label-y')
        .attr('x',-obj.chartH/2)
        .attr('y',0);

    // update portraits
    svg.selectAll('.portrait')
        .attr('transform',d => `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`)

}

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
    const age = years + (monthsDelta / 12); // incorporate months to age
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
        .attr('class',`species ${data.species.toLowerCase()}`)
        .attr('cx',0)
        .attr('cy',0)
        .attr('r',5);

    // outer circle - currently not displayed since it doesn't encode any data
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
            let h = (d3.select(this).classed('trait-species')) ? heightMap.get(d.traitExtraSpecies) 
                : ((d3.select(this).classed('trait-humans')) ? heightMap.get(d.traitExtraHumans) 
                : ((d3.select(this).classed('trait-energy')) ? heightMap.get(d.traitEnergy) 
                : ((d3.select(this).classed('trait-open')) ? heightMap.get(d.traitOpenness) 
                : heightMap.get(d.traitAffection))));
            if (typeof h == 'undefined'){
                h = 0;
            }

            d3.select(this)
                .style('width',`${ray.w}px`)
                .style('height',`${h}px`);

            // d3.select(this).node().getBBox().height; // 10 18 26 34 42
            // get x and y of rotation
            const degrees = ((72*i)+15);
            const radians = ((degrees * Math.PI) / 180) - (Math.PI/2);
            const x = (10-ray.offset) * Math.cos(radians);
            const y = (10-ray.offset) * Math.sin(radians);
            return `translate(${x-(ray.w/2)},${y-h}) rotate(${degrees} ${ray.w/2} ${h})`;
        });

}

function filter(species){
    const radioInner = d3.select(`#filter-${species}s`).select('.radio-inner');
    const clicked = radioInner.classed('clicked');

    d3.selectAll('.available')
        .filter(d => d.species == species)
        .classed('hidden', function(d){
            let hidden = true;
            const hiddenSpecies = d3.select(this).classed('hidden-bySpecies');
            const hiddenTraitSpecies = d3.select(this).classed('hidden-bytraitSpecies');
            const hiddenTraitHumans = d3.select(this).classed('hidden-bytraitHumans');
            const hiddenTraitEnergy = d3.select(this).classed('hidden-bytraitEnergy');
            const hiddenTraitOpenness = d3.select(this).classed('hidden-bytraitOpenness');
            const hiddenTraitAffection = d3.select(this).classed('hidden-bytraitAffection');
            if(hiddenTraitSpecies == false && hiddenTraitHumans == false && hiddenTraitEnergy == false && hiddenTraitOpenness == false && hiddenTraitAffection == false){
                if(clicked == false){
                    hidden = false;
                    d3.select(this).classed('hidden-bySpecies',false);
                }else{
                    d3.select(this).classed('hidden-bySpecies',true);
                }
            }
            return hidden;
        })
    if(clicked){
        radioInner.classed('clicked',false);
    }else{  
        radioInner.classed('clicked',true);
    }
    checkIfAllFiltered();
}

function filterSpecies(values, handle, unencoded){
    // obj.filter.traitSpecies = encoded;
    d3.selectAll('.available')
        .classed('hidden', function(d){
            let hidden = true;
            const hiddenSpecies = d3.select(this).classed('hidden-bySpecies');
            const hiddenTraitSpecies = d3.select(this).classed('hidden-bytraitSpecies');
            const hiddenTraitHumans = d3.select(this).classed('hidden-bytraitHumans');
            const hiddenTraitEnergy = d3.select(this).classed('hidden-bytraitEnergy');
            const hiddenTraitOpenness = d3.select(this).classed('hidden-bytraitOpenness');
            const hiddenTraitAffection = d3.select(this).classed('hidden-bytraitAffection');
            if(hiddenSpecies == false && hiddenTraitHumans == false && hiddenTraitEnergy == false && hiddenTraitOpenness == false && hiddenTraitAffection == false){
                if(+d.traitExtraSpecies >= unencoded[0] && +d.traitExtraSpecies <= unencoded[1]){
                    hidden = false;
                    d3.select(this).classed('hidden-bytraitSpecies',false);
                }else{
                    d3.select(this).classed('hidden-bytraitSpecies',true);
                }
            }
            return hidden;
        })
        checkIfAllFiltered();
}

function filterHumans(values, handle, unencoded){
    // obj.filter.traitHumans = encoded;
    d3.selectAll('.available')
        .classed('hidden', function(d){
            let hidden = true;
            const hiddenSpecies = d3.select(this).classed('hidden-bySpecies');
            const hiddenTraitSpecies = d3.select(this).classed('hidden-bytraitSpecies');
            const hiddenTraitHumans = d3.select(this).classed('hidden-bytraitHumans');
            const hiddenTraitEnergy = d3.select(this).classed('hidden-bytraitEnergy');
            const hiddenTraitOpenness = d3.select(this).classed('hidden-bytraitOpenness');
            const hiddenTraitAffection = d3.select(this).classed('hidden-bytraitAffection');
            if(hiddenSpecies == false && hiddenTraitSpecies == false && hiddenTraitEnergy == false && hiddenTraitOpenness == false && hiddenTraitAffection == false){
                if(+d.traitExtraHumans >= unencoded[0] && +d.traitExtraHumans <= unencoded[1]){
                    hidden = false;
                    d3.select(this).classed('hidden-bytraitHumans',false);
                }else{
                    d3.select(this).classed('hidden-bytraitHumans',true);
                }
            }
            return hidden;
        })
        checkIfAllFiltered();
}

function filterEnergy(values, handle, unencoded){
    // obj.filter.traitEnergy = encoded;
    d3.selectAll('.available')
        .classed('hidden', function(d){
            let hidden = true;
            const hiddenSpecies = d3.select(this).classed('hidden-bySpecies');
            const hiddenTraitSpecies = d3.select(this).classed('hidden-bytraitSpecies');
            const hiddenTraitHumans = d3.select(this).classed('hidden-bytraitHumans');
            const hiddenTraitEnergy = d3.select(this).classed('hidden-bytraitEnergy');
            const hiddenTraitOpenness = d3.select(this).classed('hidden-bytraitOpenness');
            const hiddenTraitAffection = d3.select(this).classed('hidden-bytraitAffection');
            if(hiddenSpecies == false && hiddenTraitHumans == false && hiddenTraitSpecies == false && hiddenTraitOpenness == false && hiddenTraitAffection == false){
                if(+d.traitEnergy >= unencoded[0] && +d.traitEnergy <= unencoded[1]){
                    hidden = false;
                    d3.select(this).classed('hidden-bytraitEnergy',false);
                }else{
                    d3.select(this).classed('hidden-bytraitEnergy',true);
                }
            }
            return hidden;
        })
        checkIfAllFiltered();
}

function filterOpenness(values, handle, unencoded){
    // obj.filter.traitOpenness = encoded;
    d3.selectAll('.available')
        .classed('hidden', function(d){
            let hidden = true;
            const hiddenSpecies = d3.select(this).classed('hidden-bySpecies');
            const hiddenTraitSpecies = d3.select(this).classed('hidden-bytraitSpecies');
            const hiddenTraitHumans = d3.select(this).classed('hidden-bytraitHumans');
            const hiddenTraitEnergy = d3.select(this).classed('hidden-bytraitEnergy');
            const hiddenTraitOpenness = d3.select(this).classed('hidden-bytraitOpenness');
            const hiddenTraitAffection = d3.select(this).classed('hidden-bytraitAffection');
            if(hiddenSpecies == false && hiddenTraitHumans == false && hiddenTraitSpecies == false && hiddenTraitEnergy == false && hiddenTraitAffection == false){
                if(+d.traitOpenness >= unencoded[0] && +d.traitOpenness <= unencoded[1]){
                    hidden = false;
                    d3.select(this).classed('hidden-bytraitOpenness',false);
                }else{
                    d3.select(this).classed('hidden-bytraitOpenness',true);
                }
            }
            return hidden;
        })
        checkIfAllFiltered();
}

function filterAffection(values, handle, unencoded){
    // obj.filter.traitAffection = encoded;
    d3.selectAll('.available')
        .classed('hidden', function(d){
            let hidden = true;
            const hiddenSpecies = d3.select(this).classed('hidden-bySpecies');
            const hiddenTraitSpecies = d3.select(this).classed('hidden-bytraitSpecies');
            const hiddenTraitHumans = d3.select(this).classed('hidden-bytraitHumans');
            const hiddenTraitEnergy = d3.select(this).classed('hidden-bytraitEnergy');
            const hiddenTraitOpenness = d3.select(this).classed('hidden-bytraitOpenness');
            const hiddenTraitAffection = d3.select(this).classed('hidden-bytraitAffection');
            if(hiddenSpecies == false && hiddenTraitHumans == false && hiddenTraitSpecies == false && hiddenTraitEnergy == false && hiddenTraitOpenness == false){
                if(+d.traitAffection >= unencoded[0] && +d.traitAffection <= unencoded[1]){
                    hidden = false;
                    d3.select(this).classed('hidden-bytraitAffection',false);
                }else{
                    d3.select(this).classed('hidden-bytraitAffection',true);
                }
            }
            return hidden;
        })
    checkIfAllFiltered();
}

function checkIfAllFiltered(){
    const availableCount = d3.selectAll('.available').size();
    let hiddenCount = 0;
    d3.selectAll('.available')
        .each(function(d){
            const hidden = d3.select(this).classed('hidden');
            if(hidden == true){ hiddenCount++; }
        })
    if(availableCount == hiddenCount && availableCount > 0){
        d3.select('#no-match').classed('hidden',false);
    }else{
        d3.select('#no-match').classed('hidden',true);
    }
}

function howToRead(direction){
    if(obj.howToReadStep == 1){

        // legend elements
        d3.selectAll('.htr-1').classed('hidden',false);
        d3.selectAll('.htr-2').classed('hidden',true);
        d3.selectAll('.htr-3').classed('hidden',true);

        // unhide content for mobile
        d3.selectAll('.m-step')
            .classed('hidden', function(){
                const thisId = d3.select(this).attr('id');
                return (thisId == `m-step-${obj.howToReadStep}`) ? false : true;
            });

        if(direction == 'forward'){
            // sidebar
            d3.select('#content-filters')
                .classed('hidden',true);
            d3.select('#content-success-stories')
                .classed('hidden',true);
            d3.select('#content-how-to-read')
                .classed('hidden',false);
            d3.selectAll('.link-next')
                .html('next →&nbsp;');
            d3.selectAll('.span-name')
                .html(`${obj.animalMax.name}`);
            d3.selectAll('.span-age')
                .html(`${obj.animalMax.age.toFixed(1)}`);
            d3.selectAll('.span-duration')
                .html(`${obj.animalMax.duration.toFixed(0)}`);
            d3.selectAll('.span-size')
                .html(`${obj.animalMax.weightCat}`);
            d3.selectAll('.span-color')
                .html(`${obj.animalMax.colorCat}`);
            d3.selectAll('.span-species')
                .html(`${obj.animalMax.species.toLowerCase()}`);
            d3.selectAll('.span-gender')
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
                .style('height',(obj.isMLandscape == 1) ? null : `${Math.ceil(maxHeight)}px`);

            // update chart
            d3.selectAll(`.${obj.dataFilter}`)
                .transition()
                .style('opacity',d => (d.id == obj.animalMax.id) ? 1 : dimmed);

            // add axis text and lines to chart
            d3.select('#g-legend')
                .attr('transform',`translate(${obj.xScale(obj.animalMax.duration)},${obj.yScale(obj.animalMax.age)})`);
            d3.select('#text-age')
                .attr('x',-(obj.xScale(obj.animalMax.duration)-obj.m.l+12))
                .attr('y',0)
                .attr('dy','0.32em') // manual adjustment
                .text(obj.animalMax.age.toFixed(1));
            d3.select('#text-duration')
                .attr('x',0)
                .attr('y',obj.chartH - obj.m.b - obj.yScale(obj.animalMax.age) + 9)
                .attr('dy','0.71em') // manual adjustment
                .text(obj.animalMax.duration.toFixed(0));

            // if mobile
            if(obj.isMobile == 1){
                d3.select('#htr-mobile').classed('hidden',false);
                // set width
                const width = obj.chartW /*- (obj.m.l*0.5) - (obj.m.r*0.5)*/;
                d3.select('#htr-mobile').style('width',`${width}px`);
                // get height
                const height = d3.select('#htr-mobile').node().getBoundingClientRect().height;
                // position around portrait
                const portraitCY = d3.select(`#portrait-${obj.animalMax.id}`).select('.species').node().getBoundingClientRect().y + 5;
                const svgNode = d3.select('#chart').node().getBoundingClientRect();
                const svgCY = svgNode.y + (svgNode.height/2);
                const yBottom = Math.max(portraitCY + 50,svgNode.y+svgNode.height-obj.m.b-height-10);
                const yTop = portraitCY - 50 - height;
                obj.mHTRy1 = (portraitCY < svgCY) ? yBottom : yTop;
                d3.select('#htr-mobile')
                    .style('top',`${obj.mHTRy1}px`)
                    .style('left',`${svgNode.x /*+ (obj.m.l*0.5)*/}px`);
            }
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
                .attr('x',-(obj.xScale(obj.animalMax.duration)-obj.m.l+12));
            d3.select('#text-duration')
                .transition()
                .attr('y',obj.chartH - obj.m.b - obj.yScale(obj.animalMax.age) + 9);

            if(obj.isMobile == 1){
                d3.select('#htr-mobile')
                    .transition()
                    .style('top',`${obj.mHTRy1}px`);
            }else if(obj.isMLandscape == 1){
                d3.selectAll('.htr-1').style('opacity',1);
                d3.select('#x-scale').style('opacity',1);
                d3.select('#y-scale').style('opacity',1);
                d3.selectAll('.axis-label').style('opacity',0.4);
            }
        }

        // update sidebar -- moved after so paragraph heights could be accurately calculated
        d3.selectAll('.step')
            .classed('hidden', function(){
                const thisId = d3.select(this).attr('id');
                return (thisId == `step-${obj.howToReadStep}`) ? false : true;
            });
        d3.selectAll('.link-prev')
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
        d3.selectAll('.m-step')
            .classed('hidden', function(){
                const thisId = d3.select(this).attr('id');
                return (thisId == `m-step-${obj.howToReadStep}`) ? false : true;
            });
        d3.selectAll('.link-prev')
            .classed('link-disabled',false);

        // if mobile, adjust text position
        if(obj.isMobile == 1){
            const height = d3.select('#htr-mobile').node().getBoundingClientRect().height;
            const svgNode = d3.select('#chart').node().getBoundingClientRect();
            obj.mHTRy2 = svgNode.y+svgNode.height-height-10;
            if(direction == 'forward'){
                d3.select('#htr-mobile')
                    .transition()
                    .style('top',`${obj.mHTRy2}px`);
            }else{
                d3.select('#htr-mobile')
                    .style('top',`${obj.mHTRy2}px`);
            }
        }else if(obj.isMLandscape == 1){
            d3.selectAll('.htr-1').style('opacity',0.5);
            d3.select('#x-scale').style('opacity',0.5);
            d3.select('#y-scale').style('opacity',0.5);
            d3.selectAll('.axis-label').style('opacity',0.2);
        }

        if(direction == 'forward'){
            // transform axis and portraits
            obj.xScale.domain([obj.animalMax.duration-2,obj.animalMax.duration+2]);
            obj.yScale.domain((obj.isMobile == 0) ? [obj.animalMax.age-1,obj.animalMax.age+1] : [obj.animalMax.age-2,obj.animalMax.age+1]);
            d3.select('#x-scale')
                .transition()
                .call((obj.isMobile == 0) ? d3.axisBottom(obj.xScale).ticks(4).tickFormat(d3.format('d')) : d3.axisBottom(obj.xScale).ticks(2).tickFormat(d3.format('d')));
            d3.select('#y-scale')
                .transition()
                .call((obj.isMobile == 0) ? d3.axisLeft(obj.yScale).ticks(2).tickFormat(d3.format('d')) : d3.axisLeft(obj.yScale).ticks(4).tickFormat(d3.format('d')));
            d3.selectAll(`.${obj.dataFilter}`)
                .transition()
                .attr('transform',d => (d.id == obj.animalMax.id) ? (obj.isMobile == 0 && obj.isMLandscape == 0) ? `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)}) scale(2)` : `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)}) scale(1.5)`
                : `translate(${obj.xScale(d.duration)},${obj.yScale(d.age)})`);

            // legend
            d3.select('#g-legend')
                .transition()
                .attr('transform',`translate(${obj.xScale(obj.animalMax.duration)},${obj.yScale(obj.animalMax.age)})`);
            d3.select('#text-age')
                .transition()
                .attr('x',-(obj.xScale(obj.animalMax.duration)-obj.m.l+12));
            d3.select('#text-duration')
                .transition()
                .attr('y',obj.chartH - obj.m.b - obj.yScale(obj.animalMax.age) + 9);
            d3.selectAll('.htr-2')
                .style('opacity',0)
                .transition()
                .delay(250)
                .style('opacity',1);
        }else{
            d3.selectAll('.link-next').html('next →&nbsp;');
        }
    }else if(obj.howToReadStep == 3){
        d3.selectAll('.htr-2').classed('hidden',true);
        d3.selectAll('.htr-3').classed('hidden',false);

        d3.selectAll('.step')
            .classed('hidden', function(){
                const thisId = d3.select(this).attr('id');
                return (thisId == `step-${obj.howToReadStep}`) ? false : true;
            });

        d3.selectAll('.m-step')
            .classed('hidden', function(){
                const thisId = d3.select(this).attr('id');
                return (thisId == `m-step-${obj.howToReadStep}`) ? false : true;
            });

        d3.selectAll('.link-next').html('done');

        // if mobile, adjust text position
        if(obj.isMobile == 1){
            const height = d3.select('#htr-mobile').node().getBoundingClientRect().height;
            const svgNode = d3.select('#chart').node().getBoundingClientRect();
            obj.mHTRy3 = svgNode.y+svgNode.height-height-10;
            d3.select('#htr-mobile')
                // .transition()
                .style('top',`${obj.mHTRy3}px`);
        }
        

    }else if(obj.howToReadStep == 0){
        d3.select('#btn-read').classed('pin-btn-active',false);
        d3.select('#g-legend').classed('hidden',true);
        d3.select('#htr-mobile').classed('hidden',true);

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

        if(obj.isMLandscape == 1){
            d3.selectAll('.htr-1').style('opacity',1);
            d3.select('#x-scale').style('opacity',1);
            d3.select('#y-scale').style('opacity',1);
            d3.selectAll('.axis-label').style('opacity',0.4);
        }
    }
}

function setUpLegend(){
    d3.select('#g-legend')
        .attr('transform',`translate(${obj.xScale(obj.animalMax.duration)},${obj.yScale(obj.animalMax.age)})`);
    d3.select('#g-size-legend')
        .attr('transform',(obj.isMobile == 0 && obj.isMLandscape == 0) ? 'translate(-200,-30)' : (obj.isMLandscape == 1) ? 'translate(-180,-30)' : 'translate(-100,-100)');
    d3.select('#g-color')
        .attr('transform',(obj.isMobile == 0 && obj.isMLandscape == 0) ? 'translate(-200,10)' : (obj.isMLandscape == 1) ? 'translate(-180,10)' : 'translate(5,-128)');
    d3.select('#g-species')
        .attr('transform',(obj.isMobile == 0 && obj.isMLandscape == 0) ? 'translate(120,-30)' : (obj.isMLandscape == 1) ?' translate(100,-30)' : 'translate(-75,102)');
    d3.select('#g-gender')
        .attr('transform',(obj.isMobile == 0 && obj.isMLandscape == 0) ? 'translate(120,20)' : (obj.isMLandscape == 1) ? 'translate(100,20)' : 'translate(5,80)');

    if(obj.isMobile == 0 && obj.isMLandscape == 0){
        d3.selectAll('.size-background-circle')
            .attr('r',function(){
                let radius;
                thisId = d3.select(this).attr('id');
                if(thisId == 'background-circle-small'){ radius = weightMap.get('small');
                }else if(thisId == 'background-circle-medium'){ radius = weightMap.get('medium');
                }else if(thisId == 'background-circle-large'){ radius = weightMap.get('large');
                }else{ radius = ((+(thisId[thisId.length -1]) * rayUnits) + 10) * 2 };
                return radius;
            });

        d3.selectAll('.g-trait')
            .each(function(d,i){
                const degrees = ((72*i)+15);
                const radians = ((degrees * Math.PI) / 180) - (Math.PI/2);
                const radius = (obj.isMobile == 0) ? ((5 * rayUnits) + 10) * 2 : ((5 * rayUnits) + 10) * 1.5;
                const x = (radius + 10) * Math.cos(radians);
                const y = (radius + 10) * Math.sin(radians);
                d3.select(this).attr('transform',`translate(${x},${y})`);
            })
    }else{
        d3.selectAll('.size-background-circle')
            .attr('r',function(){
                let radius;
                thisId = d3.select(this).attr('id');
                if(thisId == 'background-circle-small'){ radius = weightMap.get('small') * 0.75;
                }else if(thisId == 'background-circle-medium'){ radius = weightMap.get('medium') * 0.75;
                }else if(thisId == 'background-circle-large'){ radius = weightMap.get('large') * 0.75;
                }else{ radius = ((+(thisId[thisId.length -1]) * rayUnits) + 10) * 1.5 };
                return radius;
            });

        if(obj.firstHTR == 1){
            obj.firstHTR = 0;

            d3.selectAll('.g-trait').selectAll('.legend-text')
                .attr('x',0)
                .attr('y',20);

            d3.select('#g-extraSpecies').select('tspan')
                .attr('x',0);

            d3.select('#g-extraHumans').select('tspan')
                .attr('x',0)
                .html('with');

            d3.select('#g-extraHumans').select('.legend-text')
                .append('tspan')
                .attr('x',0)
                .attr('dy','1.2em')
                .html('people');
        }

        d3.selectAll('.g-trait')
            .each(function(d,i){
                const extraSpace = (d3.select(this).attr('id') == 'g-extraSpecies') ? 45 : (d3.select(this).attr('id') == 'g-affection') ? 15 : 10;
                const degrees = ((72*i)+15);
                const radians = ((degrees * Math.PI) / 180) - (Math.PI/2);
                const radius = (obj.isMobile == 0 && obj.isMLandscape == 0) ? ((5 * rayUnits) + 10) * 2 : ((5 * rayUnits) + 10) * 1.5;
                const x = (radius + extraSpace) * Math.cos(radians);
                const y = (radius + extraSpace) * Math.sin(radians);
                d3.select(this).attr('transform',`translate(${x},${y})`);
            })
    }

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
    });

    d3.select('#rect-color-indicator')
        .attr('x1', (obj.animalMax.colorCat == 'dark') ? 5 : ((obj.animalMax.colorCat == 'medium') ? 40 : 75))
        .attr('x2', (obj.animalMax.colorCat == 'dark') ? 5 : ((obj.animalMax.colorCat == 'medium') ? 40 : 75))
        .style('opacity', (obj.animalMax.colorCat == 'multi') ? 0 : 1);

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
}

function activateTooltip(data){
    const tooltip = d3.select('#tooltip');
    tooltip.classed('hidden',false);
    // display partial tooltip for mobile
    if(obj.isMobile == 1 || obj.isMLandscape == 1){
        tooltip.select('.spacer').classed('hidden',true);
        tooltip.selectAll('.demo-desc').classed('hidden',true);
    }

    // trait descriptions
    tooltip.select('#tooltip-extraSpecies').select('.species').html(`${data.species}s`);
    tooltip.select('#ind-species').style('margin-left',`${scaleMap.get(data.traitExtraSpecies)}`);
    tooltip.select('#ind-humans').style('margin-left',`${scaleMap.get(data.traitExtraHumans)}`);
    tooltip.select('#ind-energy').style('margin-left',`${scaleMap.get(data.traitEnergy)}`);
    tooltip.select('#ind-openness').style('margin-left',`${scaleMap.get(data.traitOpenness)}`);
    tooltip.select('#ind-affection').style('margin-left',`${scaleMap.get(data.traitAffection)}`);

    // position tooltip
    const tooltipNode = tooltip.node().getBoundingClientRect();
    const portraitCY = d3.select(`#portrait-${data.id}`).select('.species').node().getBoundingClientRect().y + 5;
    const portraitCX = d3.select(`#portrait-${data.id}`).select('.species').node().getBoundingClientRect().x + 5;
    const svgNode = d3.select('#chart').node().getBoundingClientRect();
    const svgCX = svgNode.x + (svgNode.width/2);
    const svgCY = svgNode.y + (svgNode.height/2);
    const radius = ((5 * rayUnits) + 10);
    const iconOffset = 16;

    if(obj.isMobile == 1){
        tooltip
            .style('left', svgCX-(tooltipNode.width/2) +'px')
            .style('top', (portraitCY < svgCY) ? (portraitCY+80)+'px' : (portraitCY-80-tooltipNode.height)+'px');

        // draw attention to sidebar to click
        d3.select('#sidebar-toggle').select('i')
            .classed('animate',true);

    }else if(obj.isMLandscape == 1){
        const tooltipDelta = window.innerHeight - (portraitCY-35+tooltipNode.height);

        tooltip
            .style('left', (portraitCX < svgCX) ? (portraitCX + radius + iconOffset) +'px' : (portraitCX - radius - tooltipNode.width - (iconOffset/2)) +'px')
            .style('top', (tooltipDelta > 0) ? (portraitCY-35)+'px' : (portraitCY-35+tooltipDelta-20)+'px');
    }else{
        const tooltipDelta = window.innerHeight - (portraitCY-35+tooltipNode.height);

        tooltip
            .style('left', (portraitCX < svgCX) ? (portraitCX + radius + iconOffset + 20) +'px' : (portraitCX - radius - tooltipNode.width - (iconOffset/2) - 20) +'px')
            .style('top', (tooltipDelta > 0) ? (portraitCY-35)+'px' : (portraitCY-35+tooltipDelta-20)+'px');

        d3.select('#tooltip-arrow')
            .classed('arrow-right', (portraitCX < svgCX) ? false : true)
            .classed('arrow-left', (portraitCX < svgCX) ? true : false)
            .style('top', (portraitCY-10)+'px')
            .style('left', (portraitCX < svgCX) ? (portraitCX + radius + iconOffset + 10) +'px' : (portraitCX - radius - (iconOffset/2) - 20) +'px')
    }

    d3.select('#tooltip-icons')
        .classed('hidden',false)
        .style('top',`${portraitCY}px`)
        .style('left',`${portraitCX}px`);

    // populate content
    tooltip.select('#tooltip-name').html(data.name);
    // dog versus cat icon
    tooltip.select('#icon-extraSpecies')
        .attr('src', `./assets/icons/${data.species}.svg`);
    d3.select('#tooltip-icons').select('#tooltip-icon-extraSpecies')
        .attr('src',`./assets/icons/${data.species}.svg`);

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
    d3.select('#demo-desc-color').select('line')
        .attr('x1', (data.colorCat == 'dark') ? 3 : ((data.colorCat == 'medium') ? 10 : 17))
        .attr('x2', (data.colorCat == 'dark') ? 3 : ((data.colorCat == 'medium') ? 10 : 17))
        .style('opacity', (data.colorCat == 'multi') ? 0 : 1);

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
            const thisOpacity = d3.select(this).style('opacity');
            if(d3.select('#content-animal-selected').classed('hidden') || thisOpacity == 1){
                activateTooltip(d);
                svg.selectAll('.portrait')
                    .sort(function(a,b){
                        if (a.id != d.id){
                            return -1;
                        }else{
                            return 1;
                        }
                    })
                    .transition()
                    .style('opacity', function(){
                        const id = d3.select(this).attr('id');
                        return (id == `portrait-${d.id}`) ? 1 : dimmed;
                    })
            }
        })
        .on('mouseleave',function(d){
            if(d3.select('#content-animal-selected').classed('hidden')){
                svg.selectAll('.portrait')
                    .transition()
                    .style('opacity', 1);

                d3.select('#tooltip').classed('hidden',true);
                d3.select('#tooltip-arrow')
                    .classed('arrow-right', false)
                    .classed('arrow-left', false);
                d3.select('#tooltip-icons')
                    .classed('hidden',true);
            }
        })
        .on('click',function(d){
            activateTooltip(d);
            if(obj.isMobile == 1){
                svg.selectAll('.portrait')
                    .sort(function(a,b){
                        if (a.id != d.id){
                            return -1;
                        }else{
                            return 1;
                        }
                    })
                    .transition()
                    .style('opacity', function(){
                        const id = d3.select(this).attr('id');
                        return (id == `portrait-${d.id}`) ? 1 : dimmed;
                    })
                if(obj.firstPortrait == 1){
                    obj.firstPortrait = 0;
                    d3.select('#sidebar-tooltip').classed('hidden',false);
                    d3.select('#tooltip-arrow')
                        .classed('hidden',false)
                        .classed('arrow-left',true)
                        .style('border-right','10px solid #444444')
                        .style('top','28.5px') // center of toggle
                        .style('left','80px');
                }
            }else{
                svg.selectAll('.portrait')
                    .style('opacity', function(){
                        const id = d3.select(this).attr('id');
                        return (id == `portrait-${d.id}`) ? 1 : dimmed;
                    });
            }

            const name = d.name.toUpperCase();
            d3.select('#sidebar-header').html(`${name}`);
            d3.select('#content-animal-selected').classed('hidden',false);
            d3.select('#filter-toggle').classed('hidden',true);
            d3.select('#content-filters').classed('hidden',true);
            d3.select('#content-success-stories').classed('hidden',true);
            d3.select('#sidebar-content').classed('content-shift-up',true);

            if(d3.select('#tooltip').classed('hidden')){
                activateTooltip(d);
            }

            d3.select('#content-animal-selected').select('img')
                .attr('src',`./assets/images/${d.name}_${d.id}.jpg`);
            d3.select('#animal-desc')
                .html(d.description);
            d3.select('#visit-desc').select('.span-name')
                .html(`${d.name}`);
            d3.select('#visit-desc')
                .classed('hidden', (obj.dataFilter == 'available') ? false : true);

            const descY = d3.select('#content-desc').node().getBoundingClientRect().y;
            const descH = (obj.isMLandscape == 1) ? Math.max(window.innerHeight - descY - 20, 20) : Math.max(window.innerHeight - descY - 60, 20);
            d3.select('#content-desc')
                .style('height',`${descH}px`);
        });
}

function deselect(){
    // hide tooltip
    d3.select('#tooltip').classed('hidden',true);
    d3.select('#tooltip-arrow')
        .classed('arrow-right', false)
        .classed('arrow-left', false);
    d3.select('#tooltip-icons')
        .classed('hidden',true);

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
        d3.select('#sidebar-content').classed('content-shift-up',false);
        svg.selectAll('.portrait').transition().style('opacity', 1);
        if(obj.dataFilter == 'available'){
            d3.select('#content-filters').classed('hidden',false);
            d3.select('#sidebar-header').html('ADOPTABLES');
        }else{
            d3.select('#content-success-stories').classed('hidden',false);
            d3.select('#sidebar-header').html('SUCCESS STORIES');
        }
    }
    // if mobile, collapse sidebar
    if(obj.isMobile == 1){
        const sidebar = d3.select('#sidebar');
        const sidebarW = sidebar.node().getBoundingClientRect().width;

        d3.select('#sidebar-toggle').select('i').classed('animate',false);
        d3.select('#sidebar-tooltip').classed('hidden',true);
        d3.select('#tooltip-arrow').classed('hidden',true);

        if(obj.sidebarClosed == 0){
            // close sidebar
            obj.sidebarClosed = 1;
            sidebar.transition().duration(500).style('left',`-${sidebarW-20}px`);
            d3.select('#sidebar-toggle').transition().style('left','20px');
            d3.select('#sidebar-toggle').select('i').transition().style('transform','rotate(0deg)');
        }
    }
    
}