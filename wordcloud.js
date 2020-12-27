//var fill=d3.(colorpal).domain(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);


//var dataset
d3.json("freq_type.json").then(function(data){
    //convert data to numbers
    data.forEach(d => {
        d.text=d.text
        d.size=+d.size
    });
    //dataset=data
    //console.log(dataset)

    //framet
    // var w = parseInt(d3.select("#cloud").style("width"), 10);
    // var h = parseInt(d3.select("#cloud").style("height"), 10);
    const w=400;
    const h=400;

    d3.layout.cloud().size([w, h])
            .words(data)
            .rotate(function () {
                return ~~(Math.random() * 2) * 90;
            })
            .fontSize(function (d) {
                return 20+(d.size)/10;
            })
            .on("end", draw)
            .start();

    function draw(words) {
        d3.select("#cloud").append("svg")
                .attr("width", w)
                .attr("height", h)
                .append("g")
                .attr("transform", "translate(" + w/3  + "," + h/3  + ")")//w/3,h/3
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function (d) {
                    return d.size/2+ "px";
                })
                .style("font-family", "Times")
                .style("cursor", 'pointer')
                .style("fill", function (d, i) {
                    //return fill(i);
                    return "#9e9662"
                })
                .attr("text-anchor", "middle")
                .attr("transform", function (d) {
                    return "translate(" + [d.x/2, d.y/2] + ")rotate(" + d.rotate + ")";
                })
                .text(function (d) {
                    return d.text;
                })
                .on("click", function (d,i) {
                    window.open("https://www.google.com/search?q=Pittsburgh " + i.text, '_blank');
                    //onclick restaurant with this keyword will show up
                });
            }
});
