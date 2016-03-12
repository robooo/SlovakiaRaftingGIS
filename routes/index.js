var express = require('express');
var router = express.Router();
var postgeo = require("postgeo");

postgeo.connect("LINK_TO_YOUR_POSTGRES_DB");

var tempInput = [];		//for making temporary paths

router.get('/mapjson/:river/:distance/:barrier/:camp', function (req, res) {
	var found = false;
	for(var i = 0; i < tempInput.length; i++) {
		if (tempInput[i].river == req.params.river &&
				tempInput[i].distance == req.params.distance &&
				tempInput[i].barrier == req.params.barrier &&
				tempInput[i].camp == req.params.camp ) {
			found=true;
			res.json(tempInput[i].data);
			break;
		}
	}

if(found == false){
	//find rivers with BARRIERS AND CAMPS
	if (req.params.river && req.params.barrier == 1 && req.params.camp == 1) {
		postgeo.query("SELECT barrier.name, barrier.type AS type, ST_AsGeoJSON(ST_Transform((barrier.way),4326),6) AS geometry" +
		" FROM (SELECT name, waterway AS type, planet_osm_point.way FROM planet_osm_point" + 
		" WHERE waterway='weir' OR waterway='waterfall' OR waterway='lock_gate') barrier," +
		" (SELECT name, waterway AS type, planet_osm_line.way as way FROM planet_osm_line WHERE name='"+req.params.river+"') rieka" +
		" WHERE ST_Intersects(barrier.way, rieka.way)" +
		" UNION ALL " +
		" SELECT DISTINCT ON (kemp.name) kemp.name, kemp.tourism, ST_AsGeoJSON(ST_Transform((kemp.way),4326),6) AS geometry " +
		" FROM (SELECT name, way FROM planet_osm_line WHERE name='"+req.params.river+"') rieka " +
		" LEFT JOIN (SELECT name,tourism, way FROM planet_osm_point WHERE tourism = 'picnic_site' OR tourism = 'camp_site' " +
		" UNION SELECT name,tourism, ST_Centroid(way) as way FROM planet_osm_polygon " + 
		" WHERE tourism = 'picnic_site' OR tourism = 'camp_site') AS kemp ON ST_DWithin(kemp.way,rieka.way,'"+req.params.distance+"')" +
		" UNION ALL " +
		" SELECT river.name, river.waterway AS type, ST_AsGeoJSON(St_Union(river.geojson),6) AS geometry " +
		" FROM (SELECT name, waterway, ST_Transform((way),4326) AS geojson FROM planet_osm_line WHERE name='"+req.params.river+"' AND waterway='river') river " +
		" GROUP BY river.name, river.waterway "
		, "geojson", function(data) {				

			var obj = {river: req.params.river, distance: req.params.distance, barrier: req.params.barrier, camp:  req.params.camp, data: data};
			tempInput.push(obj);
	
			res.json(data);
		});
	}

	//find rivers WITH BARRIERS
	if (req.params.river && req.params.barrier == 1 && req.params.camp == 0) {
		postgeo.query("SELECT barrier.name, barrier.type AS type, ST_AsGeoJSON(ST_Transform((barrier.way),4326),6) AS geometry" +
		" FROM (SELECT name, waterway AS type, planet_osm_point.way FROM planet_osm_point" + 
		" WHERE waterway='weir' OR waterway='waterfall' OR waterway='lock_gate') barrier," +
		" (SELECT name, waterway AS type, planet_osm_line.way as way FROM planet_osm_line WHERE name='"+req.params.river+"') rieka" +
		" WHERE ST_Intersects(barrier.way, rieka.way)" +
		" UNION ALL " +
		" SELECT river.name, river.waterway AS type, ST_AsGeoJSON(St_Union(river.geojson),6) AS geometry " +
		" FROM (SELECT name, waterway, ST_Transform((way),4326) AS geojson FROM planet_osm_line WHERE name='"+req.params.river+"' AND waterway='river') river " +
		" GROUP BY river.name, river.waterway "
		, "geojson", function(data) {				

			var obj = {river: req.params.river, distance: req.params.distance, barrier: req.params.barrier, camp:  req.params.camp, data: data};
			tempInput.push(obj);
	
			res.json(data);
		});
	}

	//find rivers WITH CAMPS
	if (req.params.river && req.params.barrier == 0 && req.params.camp == 1) {
		postgeo.query(
		" SELECT DISTINCT ON (kemp.name) kemp.name, kemp.tourism AS type, ST_AsGeoJSON(ST_Transform((kemp.way),4326),6) AS geometry " +
		" FROM (SELECT name, way FROM planet_osm_line WHERE name='"+req.params.river+"') rieka " +
		" LEFT JOIN (SELECT name,tourism, way FROM planet_osm_point WHERE tourism = 'picnic_site' OR tourism = 'camp_site' " +
		" UNION SELECT name,tourism, ST_Centroid(way) as way FROM planet_osm_polygon " + 
		" WHERE tourism = 'picnic_site' OR tourism = 'camp_site') AS kemp ON ST_DWithin(kemp.way,rieka.way,'"+req.params.distance+"')" +
		" UNION ALL " +
		" SELECT river.name, river.waterway AS type, ST_AsGeoJSON(St_Union(river.geojson),6) AS geometry " +
		" FROM (SELECT name, waterway, ST_Transform((way),4326) AS geojson FROM planet_osm_line WHERE name='"+req.params.river+"' AND waterway='river') river " +
		" GROUP BY river.name, river.waterway "
		, "geojson", function(data) {				
			var obj = {river: req.params.river, distance: req.params.distance, barrier: req.params.barrier, camp:  req.params.camp, data: data};
			tempInput.push(obj);
	
			res.json(data);
		});
	}

	//find just RIVERS without barriers and camps near
	if (req.params.river && req.params.barrier == 0 && req.params.camp == 0) {
		postgeo.query(
		" SELECT river.name, river.waterway AS type, ST_AsGeoJSON(St_Union(river.geojson),6) AS geometry " +
		" FROM (SELECT name, waterway, ST_Transform((way),4326) AS geojson FROM planet_osm_line WHERE name='"+req.params.river+"' AND waterway='river') river " +
		" GROUP BY river.name, river.waterway "
		, "geojson", function(data) {				

			var obj = {river: req.params.river, distance: req.params.distance, barrier: req.params.barrier, camp:  req.params.camp, data: data};
			tempInput.push(obj);
	
			res.json(data);
		});
	}
}
});

router.get('/nearpoint/:lat/:lng', function (req, res) {
	//get lenght of river in 'km'
	postgeo.query("SELECT SUM(ST_Length((ST_Transform(bp.geojson, 4326)::geography))/1000) AS geometry " +
		" FROM (SELECT name, ST_Transform((way),4326) AS geojson FROM planet_osm_line" +
		" WHERE name=( SELECT name FROM planet_osm_line WHERE waterway='river' " + 
		" AND name IS NOT NULL ORDER BY ST_Distance(public.ST_Transform((way),4326)," +
		" ST_SetSRID(ST_MakePoint('" + req.params.lng + "', '" + req.params.lat + "'),4326)) ASC LIMIT 1)) bp"
		, "json", function(length) {
			//get whole river(concated from tiles)
			postgeo.query("SELECT bp.name, ST_AsGeoJSON(ST_Transform((bp.geojson),4326),6) AS geometry " +
				" FROM (SELECT name, public.ST_Transform((way),4326) AS geojson FROM planet_osm_line" +
				" WHERE name= ( SELECT name FROM planet_osm_line WHERE waterway='river' AND name IS NOT NULL ORDER BY ST_Distance(public.ST_Transform((way),4326)," +
				" ST_SetSRID(ST_MakePoint('" + req.params.lng + "', '" + req.params.lat + "'),4326)) ASC LIMIT 1)) bp"
				, "geojson", function(data) {
				console.log(data.features[0].properties.name);
				res.json([data,{riverLength: length.features[0].geometry}]);
		});
	});
});
 
// GET MainMap page
router.get('/', function(req, res) {
	res.render('map')
});

module.exports = router;
