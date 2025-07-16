(function () {
  'use strict';

  // set the dimensions and margins of the graph
  const width = 900;
  const height = 470;

  const mapWidth = width * 0.53;
  // const plotWidth = width - mapWidth;
  const plotWidth = width - mapWidth;

  // const margin = 50;
  const margin = {
    top: 70,
    right: 60,
    bottom: 80,
    left: 60,
  };
  // adding margins:
  // const margin1 = {
  //   top: 50,
  //   right: 40,
  //   bottom: 70,
  //   left: 50,
  // };
  // const innerWidth1 = width - margin1.left - margin1.right;
  // const innerHeight1 = height - margin1.top - margin1.bottom;

  // const margin2 = {
  //   top: 60,
  //   right: 40,
  //   bottom: 77,
  //   left: 150,
  // };
  // const innerWidth2 = width - margin2.left - margin2.right;
  // const innerHeight2 = height - margin2.top - margin2.bottom;

  /* Let's create two svg elements and append them to my top-level div
     Here's the first svg, and I'll save the selection to the variable "svg" */
  const svg = d3
    .select('#forSVG1')
    .append('svg')
    .attr('width', mapWidth)
    .attr('height', height);

  /* And the second; the ".append" method returns a selection with just
     the svg in it, so I can manipulate it later (by appending or joining
     data with it) */
  const svg2 = d3
    .select('#forSVG2')
    .append('svg')
    .attr('top', 0)
    .attr('width', plotWidth)
    .attr('height', height);

  const tooltipM = d3
    .select('#forSVG1')
    .append('div')
    .attr('id', 'tooltip')
    .style('font-size', '0.7em')
    .style('position', 'absolute');
  const tooltipS = d3
    .select('#forSVG2')
    .append('div')
    .attr('id', 'tooltip')
    .style('font-size', '0.7em')
    .style('position', 'absolute');

  /* Here's the main rendering code; whenever I call this function, it
     will draw a choropleth map from the mapData and a scatter plot from
     the countryData */
  function render(mapData, catNameData, countryData) {
    /* Here's how I'm going to convert lat/long coordinates into pixel values
       on the screen; I can use whichever projection I like best */
    var projection = d3
      .geoEqualEarth()
      .fitSize([mapWidth, height], mapData);
    /* And here's the part that converts a sequence of points around a
       polygon into a valid "d" attribute for a <path> tag */
    var path = d3.geoPath(projection);

    /* Here are the names of the attributes I'll pull out of my data
       objects for my various visual channels
       It's useful to declare them once, since I will need to refer to them
       in several places (e.g. setting visual properties, axes, and labels) */
    const mapColorAttr = 'count';

    const plotColorAttr = 'country';
    var xAttr = 'max_life_expectancy';
    var xAxisLabel = 'Max Life Expectancy (yrs)';
    var yAttr = 'max_weight';
    var yAxisLabel = 'Max Weight (lbs)';

    const mapTitleX = mapWidth / 2 - 75;
    const mapTitleY = 30;
    const scatterTitleX = plotWidth / 4 - 75;
    const scatterTitleY = 30;

    const mapTitle = 'Map of Countries';
    const scatterTitle = 'Cat Breed Attributes';

    // const rAttr = 'Population';
    // const rAttr = (d) =>
    //   (d.name.length * d[xAttr]) / d[yAttr];
    const rAttr = 6;

    const legendBoxRange = [0, 2, 3, 4, 6, 8, 9, 23];
    const legendLabelRange = [0, 2, 3, 4, 6, 8, 9, 23];
    const legendTitle = ['Number of Cat Breeds'];

    // const rAttr = 'name';

    /* Here's a snippet of code that I ended up using in a couple places,
       so I've refactored it out as a function
           data: an iterable (typically Array) of all data points
           attr: the name of the attribute you want the extent of
           returns: [min, max] of the attr values in data
       Note: min and max only really makes sense for numeric types, so I've
       included a typecast (the "+") - this will keep me from accidentally
       getting tripped up when my attribute is really strings representing
       numbers */
    function getDataExtent(data, attr) {
      return d3.extent(
        /* For my data, missing values show up as empty strings, which
           JavaScript then casts to 0. I will filter out all of these to make
           sure I get the true extent of the non-missing data */
        d3.map(data, (r) => +r[attr]).filter((r) => r > 0),
      );
    }

    /* Here's a scale that converts attribute values into a color that is
       on a linear scale between white and blue */
    var mapColorScale = d3
      // The type of scale: linear, log, band, ordinal, etc.
      // .scaleLinear()
      .scaleThreshold(
        [2, 3, 4, 6, 8, 9, 23],
        [
          '#fde0dd',
          '#fa9fb5',
          '#f768a1',
          '#dd3497',
          '#ae017e',
          '#7a0177',
          '#49006a',
          '#21022E',
        ],
        /* 
          '#8c510a'
          '#bf812d'
          '#dfc27d'
          '#f6e8c3'
          '#c7eae5'
          '#80cdc1'
          '#35978f'
          '#01665e' 
          */
        /*
        "#211F5D"
        #DEE0A2
        
        #968A8A

        '#deebf7'
        '#c6dbef'
        '#9ecae1'
        '#6baed6'
        '#4292c6'
        '#2171b5'
        '#084594'
     
        '#fee0d2'
        '#fcbba1'
        '#fc9272'
        '#fb6a4a'
        '#ef3b2c'
        '#cb181d'
        '#a50f15'
        '#67000d'
        
        '#fde0dd'
        '#fcc5c0'
        '#fa9fb5'
        '#f768a1'
        '#dd3497'
        '#ae017e'
        '#7a0177'
        '#49006a'
        #fff7f3

            */
      );
    // // The range of possible input values:
    // .domain(
    //   getDataExtent(countryData.values(), mapColorAttr),
    // )
    // // And the range of possible output values:
    // // .range(['pink', 'green']);
    // .range([color1, color2]);

    /* Here are the rest of the scaling functions (for the scatter plot)
       We'll need to handle the x/y positions, radius, and color */

    // Boring linear scale for x
    const x = d3
      .scaleLinear()
      .domain(getDataExtent(catNameData.values(), xAttr))
      .range([margin.left, plotWidth - margin.right]);

    // Boring linear scale for y
    const y = d3
      // .scaleLog()
      .scaleLinear()
      .domain(getDataExtent(catNameData.values(), yAttr))
      /* Have you noticed that the range for the y axis is backwards?
         It maps the lowest input to the highest pixel value, and the highest
         input to 0 pixels. This is because the origin (0,0) for graphics is
         in the top left, instead of the bottom left like mathematicians might
         expect */
      .range([height - margin.bottom, margin.top]);

    // Color scale for the scatterplot dots
    const plotColorScale = d3.scaleOrdinal(
      d3.schemeCategory10,
    );

    // Scaling for radius of scatterplot based on given attribute
    d3.scaleLinear()
      .domain(getDataExtent(catNameData.values(), rAttr))
      .range([3, 10]);

    /* Since we need to do a little error checking here, lets write a
       nice function so that our attribute setting looks cleaner */
    function getCountryColor(d) {
      // First, try to get the data for a given country
      let entry = countryData.get(d.properties.name);
      // console.log('country_entry: ', entry);
      /* And check if we actually retrieved a value; if not, we'll only
         get "undefined" for missing data and can use a default 'grey' color */
      return entry == undefined
        ? 'grey'
        : mapColorScale(entry[mapColorAttr]);
    }

    /* This one is way more straightforward, since I assume I always have
       complete data for each point on the scatter plot */
    function getPointColor(d) {
      return plotColorScale(d[plotColorAttr]);
    }
    /* This method gets the name column from the country cat data set
       looking up the country name in the countryData (map) */
    function getCatNames(d) {
      let entry = d.properties.name;
      return countryData.has(entry)
        ? countryData.get(entry).name
        : '';

      /* if (countryData.has(entry)) {
        console.log(entry, countryData.get(entry).name);
      } else {
        console.log('not found:', entry);
      }
      */
      // if this name is in the dictionary look it up in the dictionary
    }

    //=============== MAP here is where they are adding path elements...=======================================
    /* Ok, down to brass tacks: let's add <path> elements to our first svg
       that encode the borders of each country. I'll save this selection as
       a variable, so that I can modify the countries later if I need to */
    const countryMarks = svg
      /* I like to append a <g> element that will hold all my paths, just so
         I have the option of easily adjusting or moving the entire group */
      .append('g')
      /* Since the svg is originally empty (I just created it, after all), any
         selection here will be empty; its only purpose is to give me a place
         to join my data */
      .selectAll('path')
      /* Once I have the (empty) selection, I will join all of my data points to
         it. I know that the structure of geojson is for there to be a "features"
         attribute that contains the Array of all the geo objects, and I want to
         bind each geo object to its own path */
      .data(mapData.features)
      .join('path')
      /* Ok, now that I have a shiny new <path> element with a single country's
         geo data bound to it, I'm ready to start setting them up.
         First, the fill color: I'll use the function I wrote above that converts
         a country name string into a scaled color value */
      .attr('fill', getCountryColor)
      /* Next, I'll set the "id" attribute, which will give me the ability to
         select linked items that have the same id */
      .attr('id', (d) => d.properties.name)
      .attr('class', getCatNames)
      .classed('poly', true) // for mouse events
      // .classed(,true) // to link up countries and cats

      /* Finally, lets use the default geojson setup of setting the 'd' attribute
         using our path generator function. This is sort of magic that works under
         the hood */
      .attr('d', path);

    /* This creates the individual boxes of the map legend
       note that the legend stays static even with the zooming,
       which is excellent and I don't know if it would've stayed
       if I used the legend page from observable */
    svg
      .selectAll('[empty]')
      .data(legendBoxRange)
      .join('rect')
      .attr('width', 25)
      .attr('height', 10)
      .attr('fill', (d) => mapColorScale(d))
      //.attr('stroke', 'black')
      .attr('x', (d) => 50 + 25 * legendBoxRange.indexOf(d))
      .attr('y', 75);
    // This adds the number labels of the legend
    svg
      .selectAll('[empty]')
      .data(legendLabelRange)
      .join('text')
      .text((d) => d) //.text((d) => '<' + d)
      .attr('x', (d) => 45 + 25 * legendLabelRange.indexOf(d))
      .attr('y', 100);

    // This adds the title of the legend to the Map
    svg
      .selectAll('[empty]')
      .data(legendTitle)
      .join('text')
      .text(legendTitle)
      .attr('x', 50)
      .attr('y', 70);

    // This adds the title of Map
    svg
      .selectAll('[empty]')
      .data(mapTitle)
      .join('text')
      .text(mapTitle)
      .style('font-size', '20px')
      .attr('x', mapTitleX)
      .attr('y', mapTitleY);

    /* This var and the following call is taken directly from 
       https://gist.github.com/d3noob/3fb4abdf99035adc8dfc3b3a823f8ae9
       It makes the map able to zoom and pan. */
    var zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on('zoom', function (event) {
        svg.select('g').attr('transform', event.transform);
      });

    svg.call(zoom);

    // scatter plot============================================================================================
    // x axis
    svg2
      .append('g')
      .attr('id', 'xAxisG')
      .attr(
        'transform',
        `translate(0,${height - margin.bottom})`,
      )
      // .attr(
      //   'transform',
      //   `translate(${margin.left},${height - margin.bottom})`,
      // ) // This controls the vertical position of the Axis
      .call(d3.axisBottom(x));

    // setting up axes:
    // const xAxis = d3.axisBottom(xScale).tickPadding(17);

    // x axis label
    svg2
      .append('text')
      .attr('id', 'xAxisText')
      .text(xAxisLabel)
      .attr('x', plotWidth / 2)
      .attr('y', height - margin.left / 2)
      .style('text-anchor', 'middle');

    // y axis
    svg2
      .append('g')
      .attr('id', 'yAxisG')
      // .attr('transform', `translate(${margin.left},0)`)// This controls the vertical position of the Axis
      .attr('transform', `translate(${margin.left},0)`) // This controls the vertical position of the Axis

      .call(d3.axisLeft(y));

    // y axis label
    svg2
      .append('text')
      .attr('id', 'yAxisText')
      .text(yAxisLabel)
      .attr('x', -height / 2)
      .attr('y', margin.left / 2)
      // .attr('y', -90)
      // .attr('x', -height - margin.top - margin.bottom / 2)
      .attr('transform', 'rotate(-90)')
      .style('text-anchor', 'middle');

    // This adds the title of Scatter Plot:
    svg2
      .selectAll('[empty]')
      .data(scatterTitle)
      .join('text')
      .text(scatterTitle)
      .style('font-size', '20px')
      .attr('x', scatterTitleX)
      .attr('y', scatterTitleY);

    /* Now we need to add points to our scatter plot; again I will save the
       selection as a variable so I can modify it more later */
    const scatterMarks = svg2
      .append('g')
      .selectAll('circle')
      .data(catNameData.values())
      .join('circle')
      .attr('cx', (d) => x(d[xAttr]))
      .attr('cy', (d) => y(d[yAttr]))
      // .attr('r', (d) => rScale(d[rAttr]))
      .attr('r', rAttr)

      .attr('fill', getPointColor)
      .attr('id', (d) => d.name)
      // .attr('class', (d) => `dot ${d.Continent}`)
      .attr('class', (d) => `${d.country}`) // set to countries for cats
      .classed('dot', true) // for mouse events
      .style('opacity', 0.4);

    /* Okay! It's later now: let's hook up the mouse events for our countries
       and points in the scatter plot */

    /* Planning ahead, the first thing I'm going to want to do is highlight
       matching marks in the linked plots, and I know they're linked by their
       "id" attribute matching, and differentiated by having different classes
       ("poly" for the map marks, and "dot" for the scatterplot marks) */
    function highlightMarks(country_id) {
      // Select everything with this id (polygon and dot), and set the fill
      // color for both
      d3.selectAll(`#${country_id}.poly`)
        .attr('fill', '#F6982E')
        .style('opacity', 1);
      //Select just the dot with the right id, and set its radius
      // d3.selectAll(`#${country_id}`)
      //   // d3.selectAll(`#${id}.`)
      //   .transition()
      //   .duration(750)
      //   .ease(d3.easeBounce)
      //   .attr('r', 20)
      //   .style('opacity', 1)
      //   .style('stroke', 'black');
      d3.selectAll(`.${country_id}`)
        .transition()
        .duration(750)
        .ease(d3.easeBounce)
        .attr('r', 10)
        .style('opacity', 1)
        .style('stroke', 'black');
    }

    /* Finally, I can use my scaling functions for color and radius to reset
       back to normal when I mouse out */
    function resetMarks(id) {
      // reset the points
      d3.selectAll(`.${id}`)
        .transition()
        .attr('fill', getPointColor)
        // .attr('fill', 'purple')
        // .attr('r', (d) => rScale(d[rAttr]))
        .attr('r', rAttr)
        .style('opacity', 0.4)
        .style('stroke', 'none');
      // reset the country
      d3.selectAll(`#${id}.poly`)
        .transition()
        .duration(600)
        // .attr('fill', 'red');
        .attr('fill', getCountryColor);
    }

    // function highlightContinent(continent) {
    //   d3.selectAll(`.${continent}.dot`)
    //     .style('stroke', 'black')
    //     .style('opacity', 1);
    // }

    // function unHighlightContinent(continent) {
    //   d3.selectAll(`.${continent}.dot`)
    //     .style('stroke', 'none')
    //     .style('opacity', 0.4);
    // }

    /* Highlights all countries a given cat breed is from
    by checking each country's class list for the breed's name
    and highlighting any country where the breed is found on the list */
    function highlightCountry(cat_breed) {
      // let cat_breed = element.getAttribute('id');
      d3.selectAll(`.${cat_breed}`).attr('fill', 'blue');

      /*
      let map_country = element.getAttribute('class');
      let country_list = d3.selectAll(`.${map_country}`);
      console.log(country_list);
      let map_items = d3
        .selectAll(`#${map_country}`)
        .attr('fill', 'blue');
        */

      // d3.selectAll(`.${country}.dot`);
      // .style('stroke', 'black')
      // .style('opacity', 1);
      d3.selectAll(`#${cat_breed}`)
        .transition()
        .duration(750)
        .ease(d3.easeBounce)
        .attr('r', 10)
        //
        // .attr('fill', 'black')
        .style('opacity', 1)
        .style('stroke', 'black');
    }

    /* Highlights all cats that are from a given country
    by checking each cat's class list for the country's name
    and highlighting any cat where the country is found on the list */
    function unHighlightCountry(cat_breed) {
      d3.selectAll(`.${cat_breed}`)
        // .attr('fill', 'purple');
        // console.log('unhiglight 422: ', country_list);
        .attr('fill', getCountryColor);
      // .style('stroke', 'none');
      // .style('opacity', 0.4);
      // console.log(cat_breed);
      d3.selectAll(`#${cat_breed}`)
        .transition()
        .attr('fill', getPointColor)
        // .attr('fill', 'purple')

        // .attr('r', (d) => rScale(d[rAttr]))
        .attr('r', rAttr)
        .style('opacity', 0.4)
        .style('stroke', 'none');
    }

    /* Makes the string of countries that a cat is from,
       or string of cats that are from a country */
    function makePopUpText(name_array) {
      let target_names = '';
      name_array.forEach((targetname, i) => {
        // targetname =
        //if the list is shorter than 8, it lists elements out one by one
        if (name_array.length < 8) {
          target_names = target_names.concat(
            getOrigNameWithFirstCap(targetname),
            ' <br/>',
          );
          // this else is for lists longer than 8
        } else {
          // this if is for the last element of a list so a comma isn't added at the end
          if (i == name_array.length - 1) {
            target_names = target_names.concat(
              getOrigNameWithFirstCap(targetname),
            );
            // this else is for the second element in a line, changing the modulus changes how many cats per line
          } else if ((i + 1) % 2 == 0) {
            target_names = target_names.concat(
              getOrigNameWithFirstCap(targetname),
              ' <br/>',
            );
            // this else is for the rest of the elements
          } else {
            target_names = target_names.concat(
              getOrigNameWithFirstCap(targetname),
              ', ',
            );
          }
        }
      });
      return target_names;
    }

    // Draws the map pop up tooltip using given country data
    function popUpTooltipM(event, data) {
      let country = countryData.get(data.properties.name);

      if (country == undefined) {
        console.log('country is undefined');
      } else {
        let name_array = country.name_array
          // .replaceAll('[', '')
          // .replaceAll(']', '')
          // .replaceAll("'", '')
          .split(',');
        // console.log(name_array);
        tooltipM.style('opacity', 1);

        let catnames = makePopUpText(name_array);
        tooltipM.html(
          `<b>${country.Country_orig.replaceAll('_', ' ')}</b> <br/> ${catnames}`,
        );
      }
    }

    // Draws the scatterplot pop up tooltip using given cat data
    function popUpTooltipS(event, data) {
      let cat = catNameData.get(data.name);
      if (cat == undefined) {
        console.log('cat is undefined');
      } else {
        let name_array = cat.country
          // .replaceAll('[', '')
          // .replaceAll(']', '')
          // .replaceAll("'", '')
          .split(' ');
        // console.log(name_array);
        tooltipS.style('opacity', 1);

        let countrynames = makePopUpText(name_array);
        tooltipS.html(
          `<b>${cat.name.replaceAll('_', ' ')}</b> <br/> ${countrynames}`,
        );
      }
    }

    // Moves the tooltip with the mouse
    function adjustTooltipM(event) {
      tooltipM
        .style('left', event.layerX + 10 + 'px')
        .style('top', event.layerY + 'px');
    }
    function adjustTooltipS(event) {
      tooltipS
        .style('left', event.layerX + 10 + 'px')
        .style('top', event.layerY + 'px');
    }

    /* With these behaviors captured in functions, we just need to hook them up
       as event listeners on our mark selections! */

    countryMarks
      .on('mouseover', function (event, data) {
        // console.log('HTML Element: ', this);
        // console.log('id: ', this.id);
        // console.log('class:', this.getAttribute('class'));

        // console.log(
        //   'country name from data: ',
        //   data.properties.name,
        // );
        highlightMarks(this.id);
        popUpTooltipM(event, data);
      })
      .on('mouseleave', function (event, data) {
        resetMarks(this.id);
        tooltipM.style('opacity', 0);
      });

    scatterMarks
      .on('mouseover', function (event, data) {
        // console.log('HTML Element: ', this);
        // console.log('id: ', this.id);
        // console.log('class:', this.getAttribute('class'));
        // console.log('country from data: ', data.country);

        // console.log(data);
        // highlightContinent(data.name);
        // give the highlight func the classes

        // highlightCountry(data.country); // gives the same info...
        highlightCountry(this.id);
        popUpTooltipS(event, data);

        // addCentroid(data.name);
        // addCentroid(this.id);
      })
      .on('mouseleave', function (event, data) {
        // unHighlightContinent(data.Continent);
        // console.log('mouse leave: ', this.id); // a cat name
        unHighlightCountry(this.id);
        tooltipS.style('opacity', 0);
        // resetMarks(this.id);
        // removeCentroid();
      });
    svg.on('mousemove', function (event, data) {
      adjustTooltipM(event);
    });
    svg2.on('mousemove', function (event, data) {
      adjustTooltipS(event);
    });

    /* Method that takes in a cat attribute and returns what the
    pretty label for its axis should be */
    function axisLabelMaker(attr) {
      if (attr == 'min_weight') {
        return 'Minimum Weight (lbs)';
      } else if (attr == 'max_weight') {
        return 'Maximum Weight (lbs)';
      } else if (attr == 'min_life_expectancy') {
        return 'Minimum Life Expectancy (yrs)';
      } else if (attr == 'max_life_expectancy') {
        return 'Maximum Life Expectancy (yrs)';
      } else {
        return 'no valid attribute';
      }
    }
    /* Method to reset the x axis label and the scale
    based on a drop down choice
    
    This method was built off of from Ben's code from the Choropleth
    https://vizhub.com/bepnye/63e9a99b20944c08927da443837ad3bc?edit=files&file=index.js&tabs=index.js%7EaxisStuff.js
    */
    function redrawXAxis(transitionDuration, xScale, xAttr) {
      svg2.select('#xAxisG').remove(); // removing the xaxis group
      svg2.select('#xAxisText').remove(); // removing the xaxis label

      // reseting the x axis group based off of choice selected
      svg2
        .append('g')
        .attr('id', 'xAxisG')
        .attr(
          'transform',
          `translate(0,${height - margin.bottom})`,
        )
        .transition()
        .duration(transitionDuration)
        .call(d3.axisBottom(x));

      // setting up axes:
      // const xAxis = d3.axisBottom(xScale).tickPadding(17);

      // draw the x-axis label
      svg2
        .append('text')
        .attr('id', 'xAxisText')
        .text(axisLabelMaker(xAttr))
        .attr('x', plotWidth / 2)
        .attr('y', height - margin.left / 2)
        .style('text-anchor', 'middle');
    }

    /* Method to reset the y axis label and the scale
    based on a drop down choice

    This method was built off of from Ben's code from the Choropleth
    https://vizhub.com/bepnye/63e9a99b20944c08927da443837ad3bc?edit=files&file=index.js&tabs=index.js%7EaxisStuff.js 
    */
    function redrawYAxis(transitionDuration, yScale, yAttr) {
      svg2.select('#yAxisG').remove();
      svg2.select('#yAxisText').remove();
      svg2
        .append('g')
        .attr('id', 'yAxisG')
        .attr('transform', `translate(${margin.left},0)`)
        .transition()
        .duration(transitionDuration)
        .call(d3.axisLeft(y));

      svg2
        .append('text')
        .attr('id', 'yAxisText')
        .text(axisLabelMaker(yAttr))
        .attr('x', -height / 2)
        .attr('y', margin.left / 2)
        .attr('transform', 'rotate(-90)')
        .style('text-anchor', 'middle');
    }

    //////////////////////////////////////////////////////
    //
    //   NEW AND EXCITING! FRESH OFF THE PRESSES!
    //   Here are callback functions that I use to adjust
    //   the plots based on newly updated attributes
    //
    //////////////////////////////////////////////////////

    /* Method to reset the x axis and the cx attributes of all the circles
    in the scatterplot based on the drop down choice

    This method was built off of from Ben's code from the Choropleth
    https://vizhub.com/bepnye/63e9a99b20944c08927da443837ad3bc?edit=files&file=index.js&tabs=index.js%7EaxisStuff.js
    */
    function renderNewXAttr(attrName) {
      xAttr = attrName;
      let xExtent = getDataExtent(
        catNameData.values(),
        xAttr,
      );
      x.domain(xExtent).range([
        margin.left,
        plotWidth - margin.right,
      ]);
      redrawXAxis(1000, x, xAttr);
      d3.selectAll('.dot')
        .transition()
        .duration(2000)
        .attr('cx', (d) => x(d[xAttr]));
    }

    /* Method to reset the y axis and the cy attributes of all the circles
    in the scatterplot based on the drop down choice

    This method was built off of from Ben's code from the Choropleth
    https://vizhub.com/bepnye/63e9a99b20944c08927da443837ad3bc?edit=files&file=index.js&tabs=index.js%7EaxisStuff.js
    */
    function renderNewYAttr(attrName) {
      yAttr = attrName;
      let yExtent = getDataExtent(
        catNameData.values(),
        yAttr,
      );
      y.domain(yExtent).range([
        height - margin.bottom,
        margin.top,
      ]);
      redrawYAxis(1000, y, yAttr);
      d3.selectAll('.dot')
        .transition()
        .duration(2000)
        .attr('cy', (d) => y(d[yAttr]));
    }

    //////////////////////////////////////////////////////
    //
    //  Here is where I hook the plot adjustment callbacks
    //  up to my <input> tags that I've already created in
    //  index.html
    //
    //////////////////////////////////////////////////////
    d3.select('#xAttrSelect').on('change', function () {
      renderNewXAttr(d3.select(this).property('value'));
    });

    d3.select('#yAttrSelect').on('change', function () {
      renderNewYAttr(d3.select(this).property('value'));
    });
  }

  //Read the data
  const mapUrl =
    // 'https://raw.githubusercontent.com/WhteRabb-t/CP341-datavis/main/custom.geo.json';
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
  // const catsUrl = 'new_cat_breeds.csv';
  const catsUrl =
    'https://raw.githubusercontent.com/WhteRabb-t/CP341-datavis/main/new_cat_breeds.csv';
  // const countryCatsUrl = 'new_country_cats.csv';
  const countryCatsUrl =
    'https://raw.githubusercontent.com/WhteRabb-t/CP341-datavis/main/new_country_cats.csv';
  // const countryStatsUrl =
  //   'https://raw.githubusercontent.com/bepnye/CP341/main/world-data-2023.csv';
  const continentUrl =
    'https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-continent.json';

  // methods for parsing data:
  function normalizeCountryName(s) {
    // return s.replaceAll(' ', '_').toLowerCase();
    return s.toLowerCase();
  }
  function normalizeCountryName2(s) {
    return s.replaceAll(' ', '_').toLowerCase();
  }
  function getOriginalCatNames(s) {
    return s.replaceAll('_', ' ');
  }

  /* This capitalizes the first letter of each word in a given string
     It also will specifically capitalize usa as USA */
  function capitalizeFirstLetter(s) {
    let wordList = s.split(' ');
    let cappedString = '';
    wordList.forEach((word, i) => {
      /* This if checks if a word is the last word in a string
         If it is, then it doesn't add a space after the word
         If it isn't, then it adds a space after the word */
      if (i == wordList.length - 1) {
        if (word == 'usa') {
          cappedString = cappedString.concat('USA');
        } else {
          cappedString = cappedString.concat(
            word.charAt(0).toUpperCase() + word.slice(1),
          );
        }
      } else {
        if (word == 'usa') {
          cappedString = cappedString.concat('USA ');
        } else {
          cappedString = cappedString.concat(
            word.charAt(0).toUpperCase() +
              word.slice(1) +
              ' ',
          );
        }
      }
    });
    return cappedString;
  }

  /* This is a combined function that
     removes underscores and capitalizes
     the first letter of each word in a given string */
  function getOrigNameWithFirstCap(s) {
    return capitalizeFirstLetter(getOriginalCatNames(s));
  }
  // aka main ()
  Promise.all([
    d3.json(mapUrl),
    d3.csv(catsUrl),
    d3.csv(countryCatsUrl),

    // d3.csv(countryStatsUrl),
    d3.json(continentUrl),
  ]).then(
    ([mapData, catsData, countryCatsData, continentData]) => {
      var countryData = new Map();
      var catNameData = new Map();

      // process catsData ...
      catsData.forEach((row) => {
        let country = row.country;

        /* Cleaning specific columns of my data
           Each row is an object with attributes corresponding to the columns,
           so I am going to overwrite the values for some of the attributes
           to be the correct type/format */

        // for cat data:
        row.Country_orig = country;
        row.country = normalizeCountryName(country); // need to lowercase countries
        //https://www.freecodecamp.org/news/how-to-use-javascript-collections-map-and-set/

        /* Since I'm going to be pulling in an extra dataset with Continent data,
           I'll initialize a default "unknown" value that I will (hopefully!)
           overwrite with the actual continent name. This is useful since now if
           I'm missing data for any country, it will have a valid attribute when I
           select the .Continent, saving me from anoying "undefined" bugs */
        row.Continent = 'Unknown';

        /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
        This adds a random float between -0.5 and 0.5 to the current row's 
        min and max life expectancy and weight
        */
        row.max_life_expectancy =
          parseFloat(row.max_life_expectancy) +
          (Math.random() - 0.5);
        row.min_life_expectancy =
          parseFloat(row.min_life_expectancy) +
          (Math.random() - 0.5);
        row.max_weight =
          parseFloat(row.max_weight) + (Math.random() - 0.5);
        row.min_weight =
          parseFloat(row.min_weight) + (Math.random() - 0.5);

        // countryData.set(country, row);
        catNameData.set(row.name, row);
      });
      countryCatsData.forEach((row) => {
        let country = row.country;
        // console.log(row);
        row.Country_orig = country;

        row.country = normalizeCountryName(country);
        // change the row of strings into
        // row.Population = parseNumStr(row.Population);

        row.Continent = 'Unknown';
        // countryData.set(country, row);
        countryData.set(row.country, row);
      });

      console.log('post processed', catsData);

      mapData.features.forEach((f) => {
        // console.log(f);
        f.properties.name = normalizeCountryName2(
          f.properties.name,
        );
      });
      // assigns a continent to a given country
      // continentData.forEach((row) => {
      //   let name = normalizeCountryName(row.country);
      //   if (countryData.has(name)) {
      //     console.log('^&: ', countryData.get(name));
      //     countryData.get(name).Continent =
      //       normalizeCountryName(row.continent);
      //   } else {
      //     // console.log('No match found for ', name);
      //   }
      // });
      console.log(countryData);
      console.log(catNameData);
      // console.log(continentData);
      render(mapData, catNameData, countryData);
    },
  );

})();
