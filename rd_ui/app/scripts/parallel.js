(function(d3) {

  window.parallel = function(data, containerSelector, colorGroup, dimensions) {
    var self = {},
        dragging = {},
        highlighted = null,
        container = d3.select(containerSelector);

    container.attr('id', 'parallel');

    var color = d3.scale.ordinal().range(['#1f77b4','#d62728']);

    var line = d3.svg.line().interpolate('cardinal').tension(0.85),
        axis = d3.svg.axis().orient("left"),
        background,
        foreground;

    self.render = function() {
      container.select("svg").remove();

      var bounds = [ $(container[0]).parent().width(), 350 ],
          m = [30, 10, 10, 10],
          w = bounds[0] - m[1] - m[3],
          h = bounds[1] - m[0] - m[2];

      var x = d3.scale.ordinal().rangePoints([0, bounds[0]], 0.5),
          y = {};

      var svg = container.append("svg:svg")
          .attr("width", w + m[1] + m[3])
          .attr("height", h + m[0] + m[2])
        .append("svg:g")
          .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

      x.domain(dimensions);

      var max = 0;
      dimensions.forEach(function(d){
          max = Math.max(max,d3.max(data,function(row){return row[d]}));
      });

      dimensions.forEach(function(d){
        y[d] = d3.scale.linear()
            .domain([0,max])
            .range([h, 0]);
      });

      // Add grey background lines for context.
      background = svg.append("svg:g")
          .attr("class", "background")
        .selectAll("path")
          .data(data)
        .enter().append("svg:path")
          .attr("d", path);

      // Add blue foreground lines for focus.
      foreground = svg.append("svg:g")
          .attr("class", "foreground")
        .selectAll("path")
          .data(data)
        .enter().append("svg:path")
          .attr("d", path)
          .attr("style", function(d) {
            return "stroke: " + color(d[colorGroup]) +  ";";
          });

      // Add a group element for each dimension.
      var g = svg.selectAll(".dimension")
          .data(dimensions)
        .enter().append("svg:g")
          .attr("class", "dimension")
          .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

      // Add an axis and title.
      g.append("svg:g")
          .attr("class", "axis")
          .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("svg:text")
          .attr("text-anchor", "middle")
          .attr("y", -9)
          .text(String);

      // Add and store a brush for each axis.
      g.append("svg:g")
          .attr("class", "brush")
          .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
        .selectAll("rect")
          .attr("x", -12)
          .attr("width", 24);

      function position(d) {
        var v = dragging[d];
        return v == null ? x(d) : v;
      }

      // Returns the path for a given data point.
      function path(d) {
        return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
      }

      // Handles a brush event, toggling the display of foreground lines.
      function brush() {
        var actives = dimensions.filter(function(p) {
          return !y[p].brush.empty();
         })

        var extents = actives.map(function(p) {
          return y[p].brush.extent();
        });

        /** To be factored **/
        var filter = {};
        _(actives).each(function(key, i) {
          filter[key] = {
            min: extents[i][0],
            max: extents[i][1]
          }
        });

        foreground.style("display", function(d) {
          return actives.every(function(p, i) {
            return extents[i][0] <= d[p] && d[p] <= extents[i][1];
          }) ? null : "none";
        });
      }

    }

    return self;
  };

})(d3);