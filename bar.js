let margin = 200;
let gap_between_views = 150;
let column =['RestaurantsPriceRange2','stars']

d3.csv('business.csv').then(function(data){

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
    
    dataset=data

    // let subgroups = data.concat RestaurantsPriceRange2','review_count'].slice(1)
    let bar = d3.select('#bar-chart')
    let width = (bar.attr("width") - margin) / 2;
    let height = bar.attr("height") - margin;

    let lower = bar.append("g")
            .attr('id','total_bar')
            .attr("transform", "translate(" + 100 + "," + 0 + ")");
    function calAvg(data,item){

              ls=0
              for (i=0;i < data.length;i++){
                if (isNaN(data[i][item])){ls+=0}
                else {ls+=Number(data[i][item])}
              }
              result=ls/data.length
              return result
            }
    function filterData(data,price_imp,rating_imp,review_imp){

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

      data = filterData(data,price_imp,rating_imp,review_imp)
      console.log(data)

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



        
        // data.forEach(function(d) {
        //   d.total = d3.sum(keys, k => +d[k])
        //   d.name = d.name
        //   return d
        // })
        
        let yScale = d3.scaleBand()
            .range([0, height])
            .domain(data.map(function(d) { return d.name; }));

        let xScale = d3.scaleLinear()
                .range([0,width]) //???????
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
        let yAxis = d3.axisLeft(yScale).ticks(5);
              
        let group = lower.selectAll("g.layer")
        .data(d3.stack().keys(keys)(data), d => d.key)
        group.exit().remove()
        
		    group.enter().insert("g", ".y-axis").append("g")
			.classed("layer", true)
			.attr("fill", d => z(d.key));

      let bars =lower.selectAll("g.layer").selectAll("rect")
      .data(d =>d, e => e.data.name);
      
      bars.exit().remove()


      bars.enter().append("rect")
			.attr("height", yScale.bandwidth())
      .merge(bars)
      .attr('id', d => d.name)
			.attr("y", d => yScale(d.data.name))
			.attr("x", d => xScale(d[1]))
      .attr("width", d => xScale(d[0]) - xScale(d[1]))
    //   .on("mouseover", function(event, d){


      
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
        .style("text-anchor", "start")
        .attr("dx", "1.4em")
        .attr("dy", ".1em");
        // .attr("transform","rotate(-175)");

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

    
    // draw_scatter(monthSelector(data, level[slider.property('value')]));
    // draw_bar(monthSelector(data, level[slider.property('value')]));
    // slidertext_price.on('onchange', val => {
    //   slidertext_price.attr('value', level[price_im.property('value')]);
    // });
    function filter_cate(cate,price,rating,review){

      new_data=[]
      
      console.log(days)
      for (i=0;i < data.length;i++){
          if ((data[i].categories.includes(cate))&(data[i].RestaurantsPriceRange2<=price)&
          (data[i].stars>=rating)&(data[i].review_count<review)){
            
            
            for (a=0;a < days.length;a++){
              
              if ((data[i][days[a]]==false)||(data[i][days[a]]==null)){
                console.log(data[i][days[a]])
                break
              } 
            }
            if (a == days.length){

              // console.log(data[i])
              new_data.push(data[i])
            }
          }
          
      }
      console.log(new_data)

      return new_data
  };
  function change_chart(event){
    d3.selectAll("circle").remove();
    d3.selectAll("rect").remove();
    d3.selectAll("text").remove();
    d3.selectAll("tick").remove();
    d3.selectAll('.x-axis').remove();
    d3.selectAll('.y-axis').remove();
    level = {'1':'not important','2':'less important','3':'more important','4':'most important'};
    month = level[this.value];

    if (this.id == 'price_im'){
      d3.select('#slidertext_'+this.id.slice(0,5)).attr('value',month);
    } else  {
      
      d3.select('#slidertext_'+this.id.slice(0,6)).attr('value',month);
    } 
    
    // d3.select('#slidertext_price').attr('value',month);
    // if (slider.property('value',month)){
    draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
      price_im.property('value'),rating_im.property('value'),review_im.property('value'));

}
function change_chart1(event){
  d3.selectAll("circle").remove();
  d3.selectAll("rect").remove();
  d3.selectAll("text").remove();
  d3.selectAll('.x-axis').remove();
  d3.selectAll('.y-axis').remove();
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
    
    draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));

}
    var keys =['price_ranking','stars_ranking','review_ranking']
    var days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    var colormap = ["#d9ffb3", "#ffb3b3",'#b366ff']
    var colormap_or = {'price_ranking':"#d9ffb3", 'stars_ranking':"#ffb3b3",'review_ranking':'#b366ff'}
    draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));

    // price_im.oninput = function(){
    //   change_chart('price')
    // }
    
    // keys = []
    // colormap = []
    // console.log(keys)
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
          pass;
        }else{
        keys.push(hhh)}
        index = keys.indexOf(hhh)
        if (colormap.includes(colormap_or[hhh])){
          pass;
        }else{
          colormap.push(colormap_or[hhh])}

        d3.selectAll("circle").remove();
        d3.selectAll("rect").remove();
        d3.selectAll("text").remove();
        d3.selectAll('.x-axis').remove();
        d3.selectAll('.y-axis').remove();
        draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      } else {
        hhh = d3.select('#price_sort').property('value')
        index = keys.indexOf(hhh)
        if (keys.includes(hhh)){
        keys= arrayRemove(keys, hhh)
        
        colormap= arrayRemove(colormap,colormap_or[hhh])

        d3.selectAll("circle").remove();
        d3.selectAll("rect").remove();
        d3.selectAll("text").remove();
        d3.selectAll('.x-axis').remove();
        d3.selectAll('.y-axis').remove();
        draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
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
          pass;
        }else{
        keys.push(hhh)}
        index = keys.indexOf(hhh)
        if (colormap.includes(colormap_or[hhh])){
          pass;
        }else{
          colormap.push(colormap_or[hhh])}


        d3.selectAll("circle").remove();
        d3.selectAll("rect").remove();
        d3.selectAll("text").remove();
        d3.selectAll('.x-axis').remove();
        d3.selectAll('.y-axis').remove();
        draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      } else {
        hhh = d3.select('#rating_sort').property('value')
        index = keys.indexOf(hhh)
        if (keys.includes(hhh)){
        keys= arrayRemove(keys, hhh)
        
        colormap= arrayRemove(colormap, colormap_or[hhh])

        d3.selectAll("circle").remove();
        d3.selectAll("rect").remove();
        d3.selectAll("text").remove();
        d3.selectAll('.x-axis').remove();
        d3.selectAll('.y-axis').remove();
        draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
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
          pass;
        }else{
        keys.push(hhh)}
        index = keys.indexOf(hhh)
        if (colormap.includes(colormap_or[hhh])){
          pass;
        }else{
          colormap.push(colormap_or[hhh])}
        // keys.push(hhh)
        
        // index = keys.indexOf(hhh)
        // colormap.push(colormap_or[hhh])

        d3.selectAll("circle").remove();
        d3.selectAll("rect").remove();
        d3.selectAll("text").remove();
        d3.selectAll('.x-axis').remove();
        d3.selectAll('.y-axis').remove();
        draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
    price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      } else {
        hhh = d3.select('#review_sort').property('value')
        index = keys.indexOf(hhh)

        if (keys.includes(hhh)){
        keys= arrayRemove(keys, hhh)
        
        colormap= arrayRemove(colormap, colormap_or[hhh])

        d3.selectAll("circle").remove();
        d3.selectAll("rect").remove();
        d3.selectAll("tick").remove();
        d3.selectAll("text").remove();
        d3.selectAll('.x-axis').remove();
        d3.selectAll('.y-axis').remove();
        draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
        price_im.property('value'),rating_im.property('value'),review_im.property('value'));
      }

        // text.style.display = "none";
      }
    }
    // check the days
    days = []
    function myFunction_day() {
      var checkBox = document.getElementById(this.id);
      
      if (checkBox.checked == true){
        days.push(d3.select('#'+this.id).property('name'))

      } else {
        if (days.includes(d3.select('#'+this.id).property('name'))){
          days= arrayRemove(days, d3.select('#'+this.id).property('name'))
        }

        // text.style.display = "none";
      }
      d3.selectAll("circle").remove();
        d3.selectAll("rect").remove();
        d3.selectAll("tick").remove();
        d3.selectAll("text").remove();
        d3.selectAll('.x-axis').remove();
        d3.selectAll('.y-axis').remove();
        myFunction_price
      draw_bar(filter_cate('Korean',price.property('value'),rating.property('value'),review.property('value')),
        price_im.property('value'),rating_im.property('value'),review_im.property('value'));
    }

    d3.select('#Monday').on('click',myFunction_day)
    d3.select('#Tuesday').on('click',myFunction_day)
    d3.select('#Wednesday').on('click',myFunction_day)
    d3.select('#Thursday').on('click',myFunction_day)
    d3.select('#Friday').on('click',myFunction_day)
    d3.select('#Saturday').on('click',myFunction_day)
    d3.select('#Sunday').on('click',myFunction_day)
    // myFunction()
})