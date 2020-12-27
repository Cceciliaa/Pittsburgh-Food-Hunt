const map = d3.select("#map");
const width = +map.attr("width");
const height = +map.attr("height");

const lgd = d3.select("#legend");
const lwidth = +map.attr("width");
const lheight = +map.attr("height");
let margin = 300;
let gap_between_views = 150;
let column =['RestaurantsPriceRange2','stars']
// loading the business dataset
let dataset;
let col;
let star_list = {};
let type = ['American']
const Cate = [
  "American",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Thai",
  "Indian",
  "Greek",
  "French",
  "Korean",
];

let colorpal = [
  "#6A5ACD",
  "#FF7F0EFF",
  "#ADFF2F",
  "#F08080",
  "#00FFFF",
  "#8C564BFF",
  "#FF1493",
  "#FF8C00",
  "#FFD700",
  "#1E90FF",
];
let colorScale = d3
  .scaleOrdinal(colorpal)
  .domain(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);

Cate.forEach((d) => {
  star_list[d] = [];
});

// Drawing the map with Pittsburgh's neighbourhood map geojson file
d3.json("Pittsburgh_2014_CDBG_Census_Tracts.json").then((mdata) => {
  // set up the projection and scale of the map
  let projection = d3.geoMercator().scale(1).translate([0, 0]).precision(0);
  let path = d3.geoPath().projection(projection);
  let pkpath = d3.geoPath().projection(projection);
  let pin = d3.geoPath().projection(projection);
  const bounds = path.bounds(mdata);

  // rescale the size and position it accordingly
  const scale =
    2 /
    Math.max(
      (bounds[1][0] - bounds[0][0]) / width,
      (bounds[1][1] - bounds[0][1]) / height
    );
  const transl = [
    (width - scale * (bounds[1][0] + bounds[0][0])) / 2,
    (height - scale * (bounds[1][1] + bounds[0][1])) / 2,
  ];
  projection.scale(scale).translate(transl);

  const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

  map.on("dblclick", reset);
  const pb = map.append("g");
  // add legend
  const legend = lgd
    .selectAll(".legend")
    .data(Cate)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function (d, i) {
      return "translate(60, " + (i * 20 + 30) + ")";
    });

  // drawing the map, with each neighbourhood as a path
  pb.append("path")
    .attr("class", "sphere")
    .attr("cursor", "pointer")
    .attr("d", path);
  const paths = pb.selectAll("path").data(mdata.features);
  paths
    .enter()
    .append("path")
    .attr("id", "basemap")
    .attr("d", path)
    .style("fill", "#A9A9A9")
    .style("stroke", "white")
    .style("opacity", 0.9)
    .style("stroke-width", "1px")
    .on("dblclick", dbclicked)
    .on("mouseover", function (d, i) {
      d3.select(this)
        .transition()
        .duration(200)
        .style("fill", "pink")
        .style("opacity", 1);
      let annotation =
        "<p><b>Neighborhood Name: </b>" + i.properties.HOOD + "</p>";
      d3.select("#info_text").html("").append("text").html(annotation);
    })
    .on("mouseout", function (d, i) {
      d3.select(this)
        .lower()
        .transition()
        .duration(200)
        .style("fill", "#A9A9A9")
        .style("opacity", 0.8);
      d3.select("#info_text").html("<p><b>Neighborhood Name: </b></p>");
    });

  // drawing parks
  d3.json("Pittsburgh_Parks.json").then((pkdata) => {
    pb.append("path2").attr("class", "sphere").attr("d", pkpath);
    pb.selectAll("path2")
      .data(pkdata.features)
      .enter()
      .append("path")
      .attr("d", pkpath)
      .style("fill", "#8FBC8F")
      .style("opacity", 0.8)
      .style("stroke", "none")
      .on("dblclick", dbclicked)
      // .on("mouseover", function (d, i) {
      //   d3.select(this)
      //     .lower()
      //     .transition()
      //     .duration(200)
      //     .style("fill", "#E9967A")
      //     .style("opacity", 1);
      //   let annotation =
      //     "<p><b>Park Name: </b>" + i.properties.origpkname + "</p>";
      //   d3.select("#info_text").html("").append("text").html(annotation);
      // })
      // .on("mouseout", function (d, i) {
      //   d3.select(this)
      //     .transition()
      //     .duration(200)
      //     .style("fill", "#8FBC8F")
      //     .style("opacity", 0.8);
      //   d3.select("#info_text").html("<p><b>Neighborhood Name: </b></p>");
      // });
  });

  // loading business data into the map
  d3.csv("business.csv").then(function (bdata) {
    //convert data to numbers
    bdata.forEach((d) => {
      d.latitue = +d.latitue;
      d.longitude = +d.longitude;
      d.stars = +d.stars;
      d.review_count = +d.review_count;
    });
    data = JSON.parse(JSON.stringify(bdata));
    dataset = bdata;
    
    const colID = function (col) {
      return colorpal.indexOf(col) >= 0
        ? Cate[colorpal.indexOf(col)]
        : "others";
    };
    function filter_cate(cate) {
      for (i = 0; i < dataset.length; i++) {
        if (dataset[i].categories.includes(cate)) {
          if (dataset[i].stars >= 4.5) star_list[cate].push(i);
          curCol = colorScale([(Cate.indexOf(cate) + 1).toString()]);
          if (dataset[i].color !== colorScale(curCol))
            dataset[i]["color"] = colorScale(curCol);
        }
      }
    }

    Cate.forEach((d) => {
      filter_cate(d);
    });

    plot_rst(dataset);

    let last_click;
    function plot_rst(rstdata) {
      
      pb.selectAll("circle").remove();
      pb.selectAll(pin)
        .data(rstdata)
        .enter()
        .append("circle", pin)
        .attr("id", (d) => { 
          return colID(d.color);
        })
        .attr('class',d => d.business_id.replace(/&/gi,'').replace(/ /gi,'').replace(/\d+/g,''))
        .attr("transform", function (d) {
          return "translate(" + projection([d.longitude, d.latitude]) + ")";
        })
        .attr("r", (d) => {
          return parseInt(d.review_count) * 0.01;
        })
        .style("fill", function (d) {
          return d.color ? d.color : "transparent";
        })
        .style("opacity", 0.8)
        .on("mouseover", function (d, i) {


// ----------------------nodes---------------------------------
          if (!last_click || colID(i.color) === last_click) {
            legend
              .selectAll("." + colID(i.color))
              .transition()
              .duration(200)
              .style("font-weight", "bold")
              .style("font-size", "15px")
              .style("width", "38")
              .style("height", "15");

            d3.select(this)
              .raise()
              .transition()
              .duration(200)
              .style("fill", "red");
            d3.select("#rst_name")
              .html("")
              .append("text")
              .html(
                "<p id='rst_name'><b>Restaurant Name: </b>" + i.name + "</p>"
              );
            // d3.select("#rst_catg")
            //   .html("")
            //   .append("text")
            //   .html(
            //     "<p id='rst_catg'><b>Categories: </b>" + i.categories + "</p>"
            //   );
            d3.select("#rst_star")
              .html("")
              .append("text")
              .html(
                "<p id='rst_star'><b>Review Stars: </b>" + i.stars + "</p>"
              );
            d3.select("#rst_ctn")
              .html("")
              .append("text")
              .html(
                "<p id='rst_ctn'><b>Review Count: </b>" +
                  i.review_count +
                  "</p>"
              );
            d3.select("#rst_addr")
              .html("")
              .append("text")
              .html("<p id='rst_addr'><b>Address: </b>" + i.address + "</p>");

//--------------------------------------------------------------------------------------------
            //draw glyph

            wr = 200,
            hr = 200;
            function filterData(data){
                //data=data[2] //data=data.features[0].properties
                //for (i=0;i < data.length;i++){
                if (data.GoodForKids==''){data.GoodForKids=5};
                if (data.GoodForKids=="TRUE"){data.GoodForKids=3};
                if (data.GoodForKids=="FALSE"){data.GoodForKids=1};
                //}
                //opening day
                // if (data.Monday | data.Tues){
                numday=0
                days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                for (i=0;i < days.length;i++){
                        if (data[days[i]]!=''){numday+=1}      
                      }
                data['numday']=numday;
                  // }
                return data;
            }

            function calP(data, item, val) {
              arr=[]
 
              if (item=='GoodForKids') {
                  if (val==5){return 100}
                  for (i=0;i < data.length;i++){
                      if (data[i][item]==''){arr.push(3)}
                      if (data[i][item]=="TRUE"){arr.push(5)}
                      if (data[i][item]=="FALSE"){arr.push(1)};
              }}
              else if (item=='numday'){
                  if (val==7){return 100}
                  for (i=0;i < data.length;i++){
                      numday=0
                      days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                      for (j=0;j < days.length;j++){
                              if (data[i][days[j]]!=''){numday+=1}      
                          }
                      data[i][item]=numday
                      arr.push(numday)
              }}
              else {
                  for (i=0;i < data.length;i++){ 
                      if (isNaN(data[i][item])){arr.push(0)}
                      else {
                          arr.push(Number(data[i][item]))
                      }
                  }
              }
              result=(100 *
                  arr.reduce((acc, v) => 
                  acc + (v < val ? 1 : 0) + (v === val ? 0.5 : 0),0)) 
                  / arr.length;
              return result
              }


            const newData=filterData(i)
            const newArray=[]//push normalized data
            newArray.push({'area':'Star','value':calP(dataset,'stars',newData.stars),'ovalue':newData.stars})
            newArray.push({'area':'Price','value':(100-calP(dataset,'RestaurantsPriceRange2',newData.RestaurantsPriceRange2)),'ovalue':newData.RestaurantsPriceRange2})
            newArray.push({'area':'Review count','value':calP(dataset,'review_count',newData.review_count),'ovalue':newData.review_count})
            newArray.push({'area':'Kids-friendly','value':calP(dataset,'GoodForKids',newData.GoodForKids),'ovalue':newData.GoodForKids})
            newArray.push({'area':'Open days','value':calP(dataset,'numday',newData.numday),'ovalue':newData.numday})


            var RadarChart = {
                draw: function(id, d, options){
                  var cfg = {
                  radius: wr/50, //radius of node
                  w: wr,
                  h: hr,
                  factor: 1, //scale of pattern
                  factorLegend: 0.7,
                  levels: 5,
                  maxValue: 100,//maximum value on the axis
                  radians: 2 * Math.PI,
                  opacityArea: 0.5,
                  //  ToRight: 5,
                  TranslateX: 50,
                  TranslateY: 30,
                  ExtraWidthX: 100,
                  ExtraWidthY: 100,
                  color: d3.scaleOrdinal().range(['#34c3eb','#3480eb'])
                  };

                  //---------change allAxis-----------
                  var allAxis = (d[0].map(function(i, j){ return i.area})); //label is the object name
                  var total = allAxis.length; //total number of axis
                  var radius = cfg.factor*Math.min(cfg.w/2, cfg.h/2);
                  var Format = d3.format('.0%');

                  d3.select(id).select("svg").remove();

                  var g = d3.select(id)
                      .append("svg")
                      .attr("width", cfg.w+cfg.ExtraWidthX)
                      .attr("height", cfg.h+cfg.ExtraWidthY)
                      .append("g")
                      .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");
              
                      var tooltip;
                  
                  //Circular level
                  for(var j=0; j<cfg.levels; j++){
                    var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
                    g.selectAll(".levels")
                    .data(allAxis)
                    .enter()
                    .append("svg:line")
                    .attr("x1", function(d, i){return levelFactor*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
                    .attr("y1", function(d, i){return levelFactor*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
                    .attr("x2", function(d, i){return levelFactor*(1-cfg.factor*Math.sin((i+1)*cfg.radians/total));})
                    .attr("y2", function(d, i){return levelFactor*(1-cfg.factor*Math.cos((i+1)*cfg.radians/total));})
                    .attr("class", "line")
                    .style("stroke", "grey")
                    .style("stroke-opacity", "0.75")
                    .style("stroke-width", "0.3px")
                    .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
                  }  
                   series = 0;
                  
                  //-----------------set the axis to objects------------------
                  var axis = g.selectAll(".axis")
                      .data(allAxis)
                      .enter()
                      .append("g")
                      .attr("class", "axis");
              
                  axis.append("line")
                    .attr("x1", cfg.w/2)
                    .attr("y1", cfg.h/2)
                    .attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
                    .attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
                    .attr("class", "line")
                    .style("stroke", "grey")
                    .style("stroke-width", "1px");
              
                  axis.append("text")
                    .attr("class", "legend")
                    .text(function(d){return d})
                    .style("font-family", "sans-serif")
                    .style("font-size", "11px")
                    .attr("text-anchor", "middle")
                    .attr("dy", "1em")
                    //.attr("transform", function(d, i){return "translate(0, -10)"})
                    .attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
                    .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});

                  d.forEach(function(y, x){
                    dataValues = [];
                    g.selectAll(".nodes")
                    .data(y, function(j, i){
                      dataValues.push([
                      cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
                      cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
                      ]);
                    });

                    dataValues.push(dataValues[0]);
                    
                    g.selectAll(".area")
                          .data([dataValues])
                          .enter()
                          .append("polygon")
                          .attr("class", "radar-chart-serie"+series)
                          .style("stroke-width", "2px")
                          .style("stroke", cfg.color(series))
                          .attr("points",function(d) {
                            var word="";
                            for(var each=0;each<d.length;each++){
                                word=word+d[each][0]+","+d[each][1]+" ";
                            }
                            return word;
                            })
                          .style("fill", cfg.color(series))
                          .style("fill-opacity", cfg.opacityArea)
                          .on('mouseover', function (d){
                          
                                    // z = "polygon."+d3.select(this).attr("class");
                                    g.selectAll("polygon")
                                    .transition(200)
                                    .style("fill-opacity", 0.8); 
                                    // g.selectAll(z)
                                    //  .transition(200)
                                    //  .style("fill-opacity", 0.8);
                                    })
                          .on('mouseout', function(){
                                    g.selectAll("polygon")
                                    .transition(200)
                                    .style("fill-opacity", cfg.opacityArea);
                          });
                    series++;
                  });

                  series=0;
              
                  d.forEach(function(y, x){
                    g.selectAll(".nodes")
                    .data(y).enter()
                    .append("svg:circle")
                    .attr("class", "radar-chart-serie"+series)
                    .attr('r', cfg.radius)
                    .attr("alt", function(j){return Math.max(j.value, 0)})
                    .attr("cx", function(j, i){
                      dataValues.push([
                      cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
                      cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
                    ]);
                    return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
                    })
                    .attr("cy", function(j, i){
                      return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
                    })
                    .attr("data-id", function(j){return j.area})
                    .style("fill", "white")
                    .style("stroke-width", "2px")
                    .style("stroke", cfg.color(series)).style("fill-opacity", .9)
                    .on('mouseover', function (d,i){
                    
                          newX =  parseFloat(d3.select(this).attr('cx'))-10 ;
                          newY =  parseFloat(d3.select(this).attr('cy'))-10 ;

                          tooltip
                            .attr('x', newX)
                            .attr('y', newY)
                            .text(Format(i.value/100))
                            .transition(200)
                            .style('opacity', 1);
              
                          // z = "polygon."+d3.select(this).attr("class");
                          g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", 0.2); 
                          // g.selectAll(z)
                          //   .transition(200)
                          //   .style("fill-opacity", .7);
                          })
                    .on('mouseout', function(){
                          tooltip
                            .transition(200)
                            .style('opacity', 0);
                          g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", cfg.opacityArea);
                          })
                    .append("svg:title")
                    .text(function(j){return j.ovalue});
              
                    series++;
                  });
                  //Tooltip
                  tooltip = g.append('text')
                        .style('opacity', 0)
                        .style('font-family', 'sans-serif')
                        .style('font-size', '13px');
                  }
              };
              RadarChart.draw("#glyph", [newArray]);
          }
        })
        .on("mouseout", function (d, i) {
          d3.select(this)
            .transition()
            .duration(200)
            .style("fill", function (d) {
              return d.color ? d.color : "transparent";
            });
          // d3.select("#rst_name")
          //   .html("")
          //   .append("text")
          //   .html("<p id='rst_name'><b>Restaurant Name: </b></p>");
          // d3.select("#rst_catg")
          //   .html("")
          //   .append("text")
          //   .html("<p id='rst_catg'><b>Categories: </b></p>");
          // d3.select("#rst_star")
          //   .html("")
          //   .append("text")
          //   .html("<p id='rst_star'><b>Review Stars: </b></p>");
          // d3.select("#rst_ctn")
          //   .html("")
          //   .append("text")
          //   .html("<p id='rst_ctn'><b>Review Count: </b></p>");
          // d3.select("#rst_addr")
          //   .html("")
          //   .append("text")
          //   .html("<p id='rst_addr'><b>Address: </b></p>");

          if (!last_click || colID(i.color) !== last_click) {
            legend
              .selectAll("." + colID(i.color))
              .transition()
              .duration(200)
              .style("font-weight", "normal")
              .style("font-size", "14px")
              .style("width", "30")
              .style("height", "10");
          }
        });

    }

    legend
      .append("rect")
      .attr("class", (d) => {
        return d;
      })
      .attr("x", 46)
      .attr("y", 8)
      .attr("width", 30)
      .attr("height", 10)
      .style("align-self", "center")
      .attr("transform", "translate(10, -1.5)")
      .style("fill", function (d) {
        return colorScale([(Cate.indexOf(d) + 1).toString()]);
      })
      .on("click", function (d, i) {
        if (last_click) {
          pb.selectAll("circle")
            .transition()
            .duration(200)
            .style("opacity", 0.8);

          legend
            .selectAll("." + last_click)
            .transition()
            .duration(200)
            .style("font-weight", "normal")
            .style("font-size", "14px")
            .style("width", "30")
            .style("height", "10");
        }

        if (last_click === i) {
          plot_rst(dataset);
          last_click = null;
        } else {
          last_click = i;
          pb.selectAll("circle")
            .transition()
            .duration(200)
            .style("opacity", 0.2);
          pb.selectAll("#" + i)
            .raise()
            .transition()
            .duration(200)
            .attr("r", (d) => {
              return parseInt(d.review_count) * 0.01 + 2;
            })
            .style("opacity", 1);

          legend
            .selectAll("." + i)
            .transition()
            .duration(200)
            .style("font-weight", "bold")
            .style("font-size", "15px")
            .style("width", "38")
            .style("height", "15");

            if (type.length != 0){type.pop(0);
                type.push(i);
              }else{
                  type.push(i)
                }
        
            bar.selectAll("rect").remove();
            bar.selectAll("text").remove();
            bar.selectAll('.x-axis').remove();
            bar.selectAll('.y-axis').remove();


        draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
        price_im.property('value'),rating_im.property('value'),review_im.property('value'));
        }
      });

    legend
      .append("text")
      .attr("class", (d) => {
        return d;
      })
      .attr("x", 45)
      .attr("y", 15)
      .style("text-anchor", "end")
      .style("font-size", "14px")
      .style("align-self", "bottom")
      .text(function (d) {
        return d;
      })
      .on("click", function (d, i) {
        if (last_click) {
          pb.selectAll("circle")
            .transition()
            .duration(200)
            .style("opacity", 0.8);

          legend
            .selectAll("." + last_click)
            .transition()
            .duration(200)
            .style("font-weight", "normal")
            .style("font-size", "14px")
            .style("width", "30")
            .style("height", "10");
        }

        if (last_click === i) {
          plot_rst(dataset);
          last_click = null;
        } else {
          last_click = i;
          pb.selectAll("circle")
            .transition()
            .duration(200)
            .style("opacity", 0.2);
          pb.selectAll("#" + i)
            .raise()
            .transition()
            .duration(200)
            .attr("r", (d) => {
              return parseInt(d.review_count) * 0.01 + 2;
            })
            .style("opacity", 1);

          legend
            .selectAll("." + i)
            .transition()
            .duration(200)
            .style("font-weight", "bold")
            .style("font-size", "15px")
            .style("width", "38")
            .style("height", "15");
        }
      });

      // bar chart
      data.forEach(d => {
        d.stars = +d.stars;
        d.categories = d.categories;
        d.review_count = +d.review_count;
        d.RestaurantsPriceRange2 = +d.RestaurantsPriceRange2;
        d.GoodForKids = d.GoodForKids;
        d.name = d.name;
        d.business_id = d.business_id
        d.stars = +d.stars;
        d.total = d.stars + d.RestaurantsPriceRange2
        d.BusinessAcceptsCreditCards = d.BusinessAcceptsCreditCards;
        // d.total = d.map(function(d) {
        //   return {date: d.RestaurantsPriceRange2, first: +d[name + " first"], second: +d[name + " second"]};
        // })
        // d.station = d.station
    });

    
    // dataset=data

    // let subgroups = data.concat RestaurantsPriceRange2','review_count'].slice(1)
    let bar = d3.select('#bar-chart')
    let width = (bar.attr("width") - margin) / 2;
    let height = bar.attr("height") - margin * 2 / 3;

    let lower = bar.append("g")
            .attr('id','total_bar');
            // .attr("transform", "translate(" + 100 + "," + 0 + ")");
    function calAvg(data,item){

              ls=0
              for (i=0;i < data.length;i++){
                if (isNaN(data[i][item])){ls+=0}
                else {ls+=Number(data[i][item])}
              }
              result=ls/data.length
              return result
            }
    function filterData1(data,price_imp,rating_imp,review_imp){

      for (a=0;a < data.length;a++){
              

       //data=data.features[0].properties
              //for (i=0;i < data.length;i++){
              if (data[a].GoodForKids==null){console.log('kk'); data[a].GoodForKids=0.5};
              if (data[a].GoodForKids=='TRUE'){data[a].GoodForKids=1};
              if (data[a].GoodForKids=='FALSE'){data[a].GoodForKids=0.1};
              //}
              //opening day
              numday=0
              days1=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
              for (i=0;i < days1.length;i++){
                      if (data[a][days1[i]]=!null){numday+=1}
                    }
                    data[a]['numday']=numday
                    data[a]['price_ranking']=(data[a]['RestaurantsPriceRange2'])*price_imp
                    data[a]['stars_ranking']=data[a]['stars']*rating_imp
                    data[a]['review_ranking']=data[a]['review_count']*review_imp/100

                  }

              return data;
          }
    function draw_bar(data,price_imp,rating_imp,review_imp){
      data = filterData1(data,price_imp,rating_imp,review_imp)


  //     newArray=[]//push normalized data
  // //--------------------------handle null-----------------------------newData.GoodForKids
  // newArray.push({'area':'Star','value':newData.stars/calAvg(data,'stars')*100,'ovalue':newData.stars})
  // newArray.push({'area':'Price','value':((calAvg(data,'RestaurantsPriceRange2')/Number(newData.RestaurantsPriceRange2)-0.5)*100),'ovalue':Number(newData.RestaurantsPriceRange2)})
  // newArray.push({'area':'Review count','value':newData.review_count/calAvg(data,'review_count')*100,'ovalue':newData.review_count})
  // newArray.push({'area':'Kids-friendly','value':(newData.GoodForKids/calAvg(data,'GoodForKids')-0.5)*100,'ovalue':newData.GoodForKids})
  // newArray.push({'area':'Open days','value':(newData.numday/7)*100,'ovalue':newData.numday})
  

        if (keys.length == 3){ 

          data.sort(function(a, b) {

            return b.price_ranking+b.stars_ranking+b.review_ranking-(a.price_ranking+a.stars_ranking+a.review_ranking)
          });} else if (keys.length == 2){
  
                if (!keys.includes("review_ranking")){
                  data.sort(function(a, b) {

                    return b.price_ranking+b.stars_ranking-(a.price_ranking+a.stars_ranking)
                  });
                }else if (!keys.includes("stars_ranking")){

                  data.sort(function(a, b) {

                    return b.price_ranking+b.review_ranking-(a.price_ranking+a.review_ranking)
                  });
                } else {
                  data.sort(function(a, b) {

                    return b.stars_ranking+b.review_ranking-(a.stars_ranking+a.review_ranking)
                  });

                }
              } else {
                if (keys.includes("price_ranking")){
                  data.sort(function(a, b) {

                    return b.price_ranking-(a.price_ranking)
                  });
                }else if (keys.includes("review_ranking")){
                  
                  data.sort(function(a, b) {

                    return b.review_ranking-(a.review_ranking)
                  });
                } else {
                  data.sort(function(a, b) {

                    return b.stars_ranking-(a.stars_ranking)
                  });

                }
              }
              data = data.slice(0,10)


        
        // data.forEach(function(d) {
        //   d.total = d3.sum(keys, k => +d[k])
        //   d.name = d.name
        //   return d
        // })
        
        let yScale = d3.scaleBand()
            .range([30, height])
            .domain(data.map(function(d) { return d.name + ';' + d.business_id; }));

        let xScale = d3.scaleLinear()
                .range([40,width])
                .domain([d3.max(data, d => d.stars_ranking+d.price_ranking+d.review_ranking),0]).nice();
        
        // color range
       
          var z = d3.scaleOrdinal()
                .range(colormap)
                .domain(keys);
        
        
        // let stack = d3.stack()
        //             .keys(['RestaurantsPriceRange2','stars'])
        //             .order(d3.stackOrderAscending)
        //             .offset(d3.stackOffsetNone);
        let b = lower
        
        
        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale).tickFormat((d) => {return d.split(';')[0]
          // total = d.split(';')[0].split(' ')
          // if (total.length>2){
          //   final = total[0]+' '+total[1]+ '\n'
          //   for (i=0;i < total.length-2;i++){
          //     final += total[i+2]+' '
    
          // }
          // final = final.slice(0,-1)
          
          // }else{
          //   final = total
          // }

          // return final
        });

        let group = lower.selectAll("g.layer")
        .data(d3.stack().keys(keys)(data), d => d.key)
        group.exit().remove()
        
		    group.enter().insert("g", ".y-axis").append("g")
			.classed("layer", true)
			.attr("fill", d => z(d.key));

      let bars =lower.selectAll("g.layer").selectAll("rect")
      .data(d => {return d }, e => {return e.data.business_id});
      
      bars.exit().remove()

      bars.enter().append("rect")
      
      .attr("height", yScale.bandwidth())
      .attr('class',d => d.data.business_id.replace(/&/gi,'').replace(/ /gi,'').replace(/\d+/g,''))
      .merge(bars)
      // .attr('id', d => d.name)
      .attr("y", e =>  yScale(e.data.name + ';' + e.data.business_id))
      .attr("x", d => xScale(d[1]))
      .attr('rx',3)
      .attr('ry',3)
      .attr("width", d => xScale(d[0]) - xScale(d[1]))
      .on("mouseover", function(d,i){



        pb.selectAll('.'+i.data.business_id.replace(/&/gi,'').replace(/ /gi,'').replace(/\d+/g,''))
        .style("fill", "red")
        .style('r','10');

        d3.select("#rst_name")
              .html("")
              .append("text")
              .html(
                "<p id='rst_name'><b>Restaurant Name: </b>" + i.data.name + "</p >"
              );
            d3.select("#rst_catg")
              .html("")
              .append("text")
              .html(
                "<p id='rst_catg'><b>Categories: </b>" + i.data.categories + "</p >"
              );
            d3.select("#rst_star")
              .html("")
              .append("text")
              .html(
                "<p id='rst_star'><b>Review Stars: </b>" + i.data.stars + "</p >"
              );
            d3.select("#rst_ctn")
              .html("")
              .append("text")
              .html(
                "<p id='rst_ctn'><b>Review Count: </b>" +
                  i.data.review_count +
                  "</p >"
              );
            d3.select("#rst_addr")
              .html("")
              .append("text")
              .html("<p id='rst_addr'><b>Address: </b>" + i.data.address + "</p >");
              legend
              .selectAll("." + colID(i.data.color))
              .transition()
              .duration(200)
              .style("font-weight", "bold")
              .style("font-size", "18px")
              .style("width", "43")
              .style("height", "13");

              //--------------------------------------------------------------------------------------------
            //draw glyph

            wr = 200,
            hr = 200;
            function filterData(data){
                //data=data[2] //data=data.features[0].properties
                //for (i=0;i < data.length;i++){
                if (data.GoodForKids==''){data.GoodForKids=5};
                if (data.GoodForKids=="TRUE"){data.GoodForKids=3};
                if (data.GoodForKids=="FALSE"){data.GoodForKids=1};
                //}
                //opening day
                // if (data.Monday | data.Tues){
                numday=0
                days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                for (i=0;i < days.length;i++){
                        if (data[days[i]]!=''){numday+=1}      
                      }
                data['numday']=numday;
                  // }
                return data;
            }

            function calP(data, item, val) {
              arr=[]
    
              if (item=='GoodForKids') {
                  if (val==5){return 100}
                  for (i=0;i < data.length;i++){
                      if (data[i][item]==''){arr.push(3)}
                      if (data[i][item]=="TRUE"){arr.push(5)}
                      if (data[i][item]=="FALSE"){arr.push(1)};
              }}
              else if (item=='numday'){
                  if (val==7){return 100}
                  for (i=0;i < data.length;i++){
                      numday=0
                      days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                      for (j=0;j < days.length;j++){
                              if (data[i][days[j]]!=''){numday+=1}      
                          }
                      data[i][item]=numday
                      arr.push(numday)
              }}
              else {
                  for (i=0;i < data.length;i++){ 
                      if (isNaN(data[i][item])){arr.push(0)}
                      else {
                          arr.push(Number(data[i][item]))
                      }
                  }
              }
              result=(100 *
                  arr.reduce((acc, v) => 
                  acc + (v < val ? 1 : 0) + (v === val ? 0.5 : 0),0)) 
                  / arr.length;
              return result
              }


            const newData=filterData(i.data)
            const newArray=[]//push normalized data
            newArray.push({'area':'Star','value':calP(dataset,'stars',newData.stars),'ovalue':newData.stars})
            newArray.push({'area':'Price','value':(100-calP(dataset,'RestaurantsPriceRange2',newData.RestaurantsPriceRange2)),'ovalue':newData.RestaurantsPriceRange2})
            newArray.push({'area':'Review count','value':calP(dataset,'review_count',newData.review_count),'ovalue':newData.review_count})
            newArray.push({'area':'Kids-friendly','value':calP(dataset,'GoodForKids',newData.GoodForKids),'ovalue':newData.GoodForKids})
            newArray.push({'area':'Open days','value':calP(dataset,'numday',newData.numday),'ovalue':newData.numday})


            var RadarChart = {
                draw: function(id, d, options){
                  var cfg = {
                  radius: wr/50, //radius of node
                  w: wr,
                  h: hr,
                  factor: 1, //scale of pattern
                  factorLegend: 0.7,
                  levels: 5,
                  maxValue: 100,//maximum value on the axis
                  radians: 2 * Math.PI,
                  opacityArea: 0.5,
                  //  ToRight: 5,
                  TranslateX: 50,
                  TranslateY: 30,
                  ExtraWidthX: 100,
                  ExtraWidthY: 100,
                  color: d3.scaleOrdinal().range(['#34c3eb','#3480eb'])
                  };

                  //---------change allAxis-----------
                  var allAxis = (d[0].map(function(i, j){ return i.area})); //label is the object name
                  var total = allAxis.length; //total number of axis
                  var radius = cfg.factor*Math.min(cfg.w/2, cfg.h/2);
                  var Format = d3.format('.0%');

                  d3.select(id).select("svg").remove();

                  var g = d3.select(id)
                      .append("svg")
                      .attr("width", cfg.w+cfg.ExtraWidthX)
                      .attr("height", cfg.h+cfg.ExtraWidthY)
                      .append("g")
                      .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");
              
                      var tooltip;
                  
                  //Circular level
                  for(var j=0; j<cfg.levels; j++){
                    var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
                    g.selectAll(".levels")
                    .data(allAxis)
                    .enter()
                    .append("svg:line")
                    .attr("x1", function(d, i){return levelFactor*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
                    .attr("y1", function(d, i){return levelFactor*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
                    .attr("x2", function(d, i){return levelFactor*(1-cfg.factor*Math.sin((i+1)*cfg.radians/total));})
                    .attr("y2", function(d, i){return levelFactor*(1-cfg.factor*Math.cos((i+1)*cfg.radians/total));})
                    .attr("class", "line")
                    .style("stroke", "grey")
                    .style("stroke-opacity", "0.75")
                    .style("stroke-width", "0.3px")
                    .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
                  }  
                   series = 0;
                  
                  //-----------------set the axis to objects------------------
                  var axis = g.selectAll(".axis")
                      .data(allAxis)
                      .enter()
                      .append("g")
                      .attr("class", "axis");
              
                  axis.append("line")
                    .attr("x1", cfg.w/2)
                    .attr("y1", cfg.h/2)
                    .attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
                    .attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
                    .attr("class", "line")
                    .style("stroke", "grey")
                    .style("stroke-width", "1px");
              
                  axis.append("text")
                    .attr("class", "legend")
                    .text(function(d){return d})
                    .style("font-family", "sans-serif")
                    .style("font-size", "11px")
                    .attr("text-anchor", "middle")
                    .attr("dy", "1em")
                    //.attr("transform", function(d, i){return "translate(0, -10)"})
                    .attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
                    .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});

                  d.forEach(function(y, x){
                    dataValues = [];
                    g.selectAll(".nodes")
                    .data(y, function(j, i){
                      dataValues.push([
                      cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
                      cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
                      ]);
                    });

                    dataValues.push(dataValues[0]);
                    
                    g.selectAll(".area")
                          .data([dataValues])
                          .enter()
                          .append("polygon")
                          .attr("class", "radar-chart-serie"+series)
                          .style("stroke-width", "2px")
                          .style("stroke", cfg.color(series))
                          .attr("points",function(d) {
                            var word="";
                            for(var each=0;each<d.length;each++){
                                word=word+d[each][0]+","+d[each][1]+" ";
                            }
                            return word;
                            })
                          .style("fill", cfg.color(series))
                          .style("fill-opacity", cfg.opacityArea)
                          .on('mouseover', function (d){
                   
                                    // z = "polygon."+d3.select(this).attr("class");
                                    g.selectAll("polygon")
                                    .transition(200)
                                    .style("fill-opacity", 0.8); 
                                    // g.selectAll(z)
                                    //  .transition(200)
                                    //  .style("fill-opacity", 0.8);
                                    })
                          .on('mouseout', function(){
                                    g.selectAll("polygon")
                                    .transition(200)
                                    .style("fill-opacity", cfg.opacityArea);
                          });
                    series++;
                  });

                  series=0;
              
                  d.forEach(function(y, x){
                    g.selectAll(".nodes")
                    .data(y).enter()
                    .append("svg:circle")
                    .attr("class", "radar-chart-serie"+series)
                    .attr('r', cfg.radius)
                    .attr("alt", function(j){return Math.max(j.value, 0)})
                    .attr("cx", function(j, i){
                      dataValues.push([
                      cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
                      cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
                    ]);
                    return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
                    })
                    .attr("cy", function(j, i){
                      return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
                    })
                    .attr("data-id", function(j){return j.area})
                    .style("fill", "white")
                    .style("stroke-width", "2px")
                    .style("stroke", cfg.color(series)).style("fill-opacity", .9)
                    .on('mouseover', function (d,i){
                 
                          newX =  parseFloat(d3.select(this).attr('cx'))-10 ;
                          newY =  parseFloat(d3.select(this).attr('cy'))-10 ;

                          tooltip
                            .attr('x', newX)
                            .attr('y', newY)
                            .text(Format(i.value/100))
                            .transition(200)
                            .style('opacity', 1);
              
                          // z = "polygon."+d3.select(this).attr("class");
                          g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", 0.2); 
                          // g.selectAll(z)
                          //   .transition(200)
                          //   .style("fill-opacity", .7);
                          })
                    .on('mouseout', function(){
                          tooltip
                            .transition(200)
                            .style('opacity', 0);
                          g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", cfg.opacityArea);
                          })
                    .append("svg:title")
                    .text(function(j){return j.ovalue});
              
                    series++;
                  });
                  //Tooltip
                  tooltip = g.append('text')
                        .style('opacity', 0)
                        .style('font-family', 'sans-serif')
                        .style('font-size', '13px');
                  }
              };
              RadarChart.draw("#glyph", [newArray]);
          
        

      })
    .on("mouseout", function(d,i){
        // d3.select(this)
        //   .style("fill", "SteelBlue");
        pb.selectAll('.'+i.data.business_id.replace(/&/gi,'').replace(/ /gi,'').replace(/\d+/g,''))
        .style('fill', d => d.color ? d.color : 'transparent')
        .style('r',(d) => {
          return parseInt(d.review_count) * 0.01;
        });

      })




        b.append('g')
        .attr('class', 'x-axis')
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        // .sort(sortvalues)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "0.15em")
        .attr("transform","rotate(-75)");

        b.append('g')
        .attr("transform","translate("+width+",0)")
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll("text")
        // .call(wrap, yScale.rangeBand())
        .attr('class', 'yTexts')
        .style("text-anchor", "start")
        .style('font-size', '8px')
        .style('overflow-wrap', 'break-word')
        .attr("dx", "1.4em")
        .attr("dy", ".1em")
        .attr("transform","translate(2, 0)");

      // #legend
        var legend = b.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 11)
        .attr("text-anchor", "end")
      .selectAll("g")
      .data(keys.slice().reverse())
      .enter().append("g")
      //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
     .attr("transform", function(d, i) { return "translate(20," + (420 + i * 20) + ")"; });
  
    legend.append("rect")
        .attr("x", width)
        .attr("width", 18)
        .attr("height", 18)
        .attr("transform", "translate(5,1)")
        .attr("fill", z);
  
    legend.append("text")
        .attr("x", width)
        .attr("y", 9)
        .attr("dy", "0.32em")
        .text(function(d) { return d; });
    bar.append('text')
        .attr("x", width-180)
        .attr("y", 11)
        .attr("dy", "0.32em")
        .text(type[0]+' Food Ranking');

    }

    let price = d3.select('#price');
    let rating = d3.select('#rating');
    let review = d3.select('#review');
    let kids = d3.select('#kids');
    let card = d3.select('#card');
    let price_im = d3.select('#price_im');
    let rating_im = d3.select('#rating_im');
    let review_im = d3.select('#review_im');
    let price_tag = [1,2,3,4,5]
    
    let slidertext_price = d3.select('#slidertext_price');
    let slidertext_rate = d3.select('#slidertext_rate');
    let slidertext_review = d3.select('#slidertext_review');
    level = {'1':'not important','2':'less important','3':'more important','4':'most important'};
    // slider.style('value',5);
    // slidertext_price.attr('value',level[price_im.property('value')]);
    
    let price_mul = (4-price_im.property('value')) * price.property('value') 
    let rating_mul = rating_im.property('value') * rating.property('value') 
    let review_mul = review_im.property('value') * (review.property('value')/100+1)

    let b;
    let new_data;
    function filter_cate1(cate,price,rating,review){
      new_data=[];

      for (i=0;i < data.length;i++){
          if ((data[i].categories.includes(cate))&(data[i].RestaurantsPriceRange2<=price)&
          (data[i].stars>=rating)&(data[i].review_count<review)){

            b = days.length;


            for (a=0;a < days.length;a++){
              if ((data[i][days[a]]==false)||(data[i][days[a]]=='')||(data[i][days[a]]==null)){

                break;
              } else{

                b-=1
              } 
            }

            // break;
            if (b == 0){
              new_data.push(dataset[i])
            }
          }
      }

      return new_data
  };
  function change_chart(event){
    bar.selectAll("circle").remove();
    bar.selectAll("rect").remove();
    bar.selectAll("text").remove();
    bar.selectAll("tick").remove();
    bar.selectAll('.x-axis').remove();
    bar.selectAll('.y-axis').remove();
    level = {'1':'not important','2':'less important','3':'more important','4':'most important'};
    month = level[this.value];

    if (this.id == 'price_im'){
      d3.select('#slidertext_'+this.id.slice(0,5)).attr('value',month);
    } else  {
      
      d3.select('#slidertext_'+this.id.slice(0,6)).attr('value',month);
    } 
    
    // d3.select('#slidertext_price').attr('value',month);
    // if (slider.property('value',month)Korean){
    draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
      price_im.property('value'),rating_im.property('value'),review_im.property('value'));

}
function change_chart1(event){
    bar.selectAll("circle").remove();
    bar.selectAll("rect").remove();
    bar.selectAll("text").remove();
    // bar.selectAll("tick").remove();
    bar.selectAll('.x-axis').remove();
    bar.selectAll('.y-axis').remove();
  level = {'1':'not important','2':'less important','3':'more important','4':'most important'};
  
  
  if (this.id == 'price'){
    level = {'1':'$','2':'$$','3':'$$$','4':'$$$$'};
    month = level[this.value];

    d3.select('#'+ this.id+'_text').attr('value',month);
  } else if (this.id == 'rating') {
    level = {'1':'1','1.5':'1.5','2':'2','2.5':'2.5','3':'3','3.5':'3.5','4':'4','4.5':'4.5','5':'5'};
    month = level[this.value];
    d3.select('#'+ this.id+'_text').attr('value',month);
  }else if (this.id == 'kids') {
    level = {'0':'FALSE','1':'TRUE'};
    month = level[this.value];
    d3.select('#'+ this.id+'_text').attr('value',month);
  }
  else if (this.id == 'card') {
    
    level = {'0':'FALSE','1':'TRUE'};
    month = level[this.value];
    
    d3.select('#'+ this.id+'_text').attr('value',month);

  }
  else  {
    level = {'0':'less than 100','100':'less than 200','200':'less than 300','300':'greater than 300'};
    month = level[this.value];
    d3.select('#'+ this.id+'_text').attr('value',month);
  } 
  
  // d3.select('#slidertext_price').attr('value',month);
  // if (slider.property('value',month)){
    
    draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));

}

    var keys =['price_ranking','stars_ranking','review_ranking']
    var days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    var colormap = ["#ffdd99", "#ffbf80",'#ff9933']
    var colormap_or = {'price_ranking':"#ffdd99", 'stars_ranking':"#ffbf80",'review_ranking':'#ff9933'}
    draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));

    price_im.on('input', change_chart);
    rating_im.on('input', change_chart);
    review_im.on('input', change_chart);
    price.on('input', change_chart1);
    rating.on('input', change_chart1);
    review.on('input', change_chart1);
    // kids.on('input', change_chart1);
    // card.on('input', change_chart1);
    // let click_price = d3.select('#price_sort');
    // click_price.on('')
    // let rating = d3.select('#rating');
    d3.select('#price_sort').on('click',myFunction_price)
    d3.select('#rating_sort').on('click',myFunction_rating)
    d3.select('#review_sort').on('click',myFunction_review)
    function arrayRemove(arr, value) { 
    
      return arr.filter(function(ele){ 
          return ele != value; 
      });
  }
  

    function myFunction_price() {
      // Get the checkbox
      var checkBox = document.getElementById("price_sort");
      
      if (checkBox.checked == true){
        hhh = d3.select('#price_sort').property('value')
        if (keys.includes(hhh)){
          
        }else{
        keys.push(hhh)
      }
        if (colormap.includes(colormap_or[hhh])){
          
        }else{
          colormap.push(colormap_or[hhh])}

        // d3.selectAll("circle").remove();
        bar.selectAll("rect").remove();
        bar.selectAll("text").remove();
        bar.selectAll('.x-axis').remove();
        bar.selectAll('.y-axis').remove();
        draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      } else {
        hhh = d3.select('#price_sort').property('value')
        index = keys.indexOf(hhh)
        if (keys.includes(hhh)){
        keys= arrayRemove(keys, hhh)
        
        colormap= arrayRemove(colormap,colormap_or[hhh])

        // d3.selectAll("circle").remove();
        bar.selectAll("rect").remove();
        bar.selectAll("text").remove();
        bar.selectAll('.x-axis').remove();
        bar.selectAll('.y-axis').remove();
        draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
        price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      }

        // text.style.display = "none";
      }
    }
    function myFunction_rating() {
      // Get the checkbox
      var checkBox = document.getElementById("rating_sort");

      if (checkBox.checked == true){
        hhh = d3.select('#rating_sort').property('value')
        if (keys.includes(hhh)){
          
        }else{
        keys.push(hhh)}
        index = keys.indexOf(hhh)
        if (colormap.includes(colormap_or[hhh])){
          
        }else{
          colormap.push(colormap_or[hhh])}


        // d3.selectAll("circle").remove();
        bar.selectAll("rect").remove();
        bar.selectAll("text").remove();
        bar.selectAll('.x-axis').remove();
        bar.selectAll('.y-axis').remove();
        draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      } else {
        hhh = d3.select('#rating_sort').property('value')
        index = keys.indexOf(hhh)
        if (keys.includes(hhh)){
        keys= arrayRemove(keys, hhh)
        
        colormap= arrayRemove(colormap, colormap_or[hhh])

        // d3.selectAll("circle").remove();
        bar.selectAll("rect").remove();
        bar.selectAll("text").remove();
        bar.selectAll('.x-axis').remove();
        bar.selectAll('.y-axis').remove();
        draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
        price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      }

        // text.style.display = "none";
      }
    }
    function myFunction_review() {
      // Get the checkbox
      var checkBox = document.getElementById("review_sort");

      if (checkBox.checked == true){
        hhh = d3.select('#review_sort').property('value')
        if (keys.includes(hhh)){
          
        }else{
        keys.push(hhh)}
        index = keys.indexOf(hhh)
        if (colormap.includes(colormap_or[hhh])){
          
        }else{
          colormap.push(colormap_or[hhh])}
        // keys.push(hhh)
        
        // index = keys.indexOf(hhh)
        // colormap.push(colormap_or[hhh])

        // d3.selectAll("circle").remove();
        bar.selectAll("rect").remove();
        bar.selectAll("text").remove();
        bar.selectAll('.x-axis').remove();
        bar.selectAll('.y-axis').remove();
        draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      } else {
        hhh = d3.select('#review_sort').property('value')
        index = keys.indexOf(hhh)

        if (keys.includes(hhh)){
        keys= arrayRemove(keys, hhh)
        
        colormap= arrayRemove(colormap, colormap_or[hhh])

        // d3.selectAll("circle").remove();
        bar.selectAll("circle").remove();
        bar.selectAll("rect").remove();
        bar.selectAll("text").remove();
        // bar.selectAll("tick").remove();
        bar.selectAll('.x-axis').remove();
        bar.selectAll('.y-axis').remove();
        draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
        price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      }

        // text.style.display = "none";
      }
    }
    // check the days
    days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    function myFunction_day() {
      var checkBox = document.getElementById(this.id);
      
      if (checkBox.checked == true){
        hhh = d3.select('#'+this.id).property('name')
        if (days.includes(hhh)){

        }else{
          days.push(d3.select('#'+this.id).property('name'))
      }
        

      } else {
        if (days.includes(d3.select('#'+this.id).property('name'))){
          days= arrayRemove(days, d3.select('#'+this.id).property('name'))
        }

        // text.style.display = "none";
      }
      // d3.selectAll("circle").remove();
      bar.selectAll("circle").remove();
      bar.selectAll("rect").remove();
      bar.selectAll("text").remove();
      // bar.selectAll("tick").remove();
      bar.selectAll('.x-axis').remove();
      bar.selectAll('.y-axis').remove();
        
      draw_bar(filter_cate1(type[0],price.property('value'),rating.property('value'),review.property('value')),
        price_im.property('value'),rating_im.property('value'),review_im.property('value'));
    }

    d3.select('#Monday').on('click',myFunction_day)
    d3.select('#Tuesday').on('click',myFunction_day)
    d3.select('#Wednesday').on('click',myFunction_day)
    d3.select('#Thursday').on('click',myFunction_day)
    d3.select('#Friday').on('click',myFunction_day)
    d3.select('#Saturday').on('click',myFunction_day)
    d3.select('#Sunday').on('click',myFunction_day)
    
  });

  pb.call(zoom);

  function reset() {
    pb.transition().style("fill", null);
    pb.transition()
      .duration(200)
      .call(
        zoom.transform,
        d3.zoomIdentity.scale(1),
        d3.zoomTransform(map.node()).invert([width / 2, height / 2])
      );
  }

  function dbclicked(event, d) {
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();
    pb.transition().style("fill", null);
    d3.select(this).transition();
    pb.transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(
            Math.min(3, 0.5 / Math.max((x1 - x0) / width, (y1 - y0) / height))
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, map.node())
      );
  }

  function zoomed(event) {
    const { transform } = event;
    pb.attr("transform", transform);
    pb.attr("stroke-width", 1 / transform.k);
  }

  return map.node();
});
