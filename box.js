"use strict";

let values = {
};

function get(name) {
	return values[name].x;
}

function set(name, value) {
	values[name] = {x:value};
}

function set_up() {
	set("material_thickness", 4);
	set("card_width", 63);
	set("card_height", 88);

	set("margin_horizontal", 3);
	set("margin_top", 6);

	set("cut_horizontal", 32);
	set("cut_vertical_straight_depth", 10);
	set("cut_vertical_curve_depth", 32);
	set("cut_small_horizontal", 4);
	set("joint_length", 6);
	set("number_of_horizontal_joints", 2);
	set("number_of_dividers", 3);
	set("distance_between_divider_middle", 20);
}


function calculate() {
	set("inner_x", get("card_width") + 2 * get("margin_horizontal"));
	set("inner_y",  get("card_height") + get("margin_top"));

	set("outer_x", get("inner_x") + 2 * get("material_thickness"));

	set("space_between_joints", (get("inner_x") - get("number_of_horizontal_joints") * get("joint_length")) / (get("number_of_horizontal_joints") + 1));

	set("number_of_fingers", get("inner_y") / get("material_thickness"));//todo: this MUST be integer
	set("flip_stays_the_same", !(get("number_of_fingers") % 2));

	set("between_cuts", get("distance_between_divider_middle") - get("material_thickness"));
}

function p(a ,b) {
	return String(a) + "," + String(b);
}

function path_divider() {
	let path = ["M 0,0"];

	const half_outer_x_without_cut = (get("outer_x") - get("cut_horizontal") - 2 * get("cut_small_horizontal")) / 2;
	path.push("h " + half_outer_x_without_cut);

	path.push("q " + p(get("cut_small_horizontal"), 0));
	path.push(p(get("cut_small_horizontal"), get("margin_top")));

	path.push("v " + get("cut_vertical_straight_depth"));

	path.push("c " + p(0, get("cut_vertical_curve_depth")));
	path.push(p(get("cut_horizontal"), get("cut_vertical_curve_depth")));
	path.push(p(get("cut_horizontal"), 0));

	path.push("v " + -get("cut_vertical_straight_depth"));
	path.push("q " + p(0, -get("margin_top")));
	path.push(p(get("cut_small_horizontal"), -get("margin_top")));

	path.push("h " + half_outer_x_without_cut);

	path.push("v " + get("joint_length"));
	path.push("h " + -get("material_thickness"));
	const horizontal_side = get("inner_y") - get("joint_length");
	path.push("v " + horizontal_side);

	for (let i = 0; i < get("number_of_horizontal_joints"); ++i) {
		path.push("h " + -get("space_between_joints"));
		path.push("v " + get("material_thickness"));
		path.push("h " + -get("joint_length"));
		path.push("v " + -get("material_thickness"));
	}
	path.push("h " + -get("space_between_joints"));

	path.push("v " + -horizontal_side);
	path.push("h " + -get("material_thickness"));
	path.push("v " + -get("joint_length"));
	return [path];
}

function path_base() {
	let all_paths = [];
	let path = ["M 0,0"];

	path.push("h " + get("material_thickness"));
	path.push("h " + get("inner_x"));
	path.push("h " + get("material_thickness"));

	const length = (get("number_of_dividers") + 1) * get("distance_between_divider_middle") - get("material_thickness");
	path.push("v " + length);

	path.push("h " + -get("material_thickness"));
	path.push("h " + -get("inner_x"));
	path.push("h " + -get("material_thickness"));

	path.push("v " + -length);

	all_paths.push(path);

	for (let i = 0; i < get("number_of_horizontal_joints"); ++i) {
		for (let j = 0; j < get("number_of_dividers"); ++j) {
			const x_pos = get("material_thickness") + (i + 1) * get("space_between_joints") + i * get("joint_length");
			const y_pos = j * get("distance_between_divider_middle") + get("between_cuts");
			let inner_path = ["M " + p(x_pos, y_pos)];
			inner_path.push("h " + get("joint_length"));
			inner_path.push("v " + get("material_thickness"));
			inner_path.push("h " + -get("joint_length"));
			inner_path.push("v " + -get("material_thickness"));

			all_paths.push(inner_path);
		}
	}

	return all_paths;
}

function path_finger_joint(number_of_fingers, flip, vertical, increasing) {
	let path = [];
	const main = (vertical ? "v" : "h") + " ";
	const side = (vertical ? "h" : "v") + " ";

	const main_sign = increasing ? 1 : -1;
	const side_sign = main_sign * (vertical ? 1 : -1);

	for (let i = 0; i < number_of_fingers; ++i) {
		if (flip) {
			path.push(main + main_sign * get("material_thickness"));
		} else {
			path.push(side + side_sign * get("material_thickness"));
			path.push(main + main_sign * get("material_thickness"));
			path.push(side + (-side_sign) * get("material_thickness"));
		}
		flip = !flip;
	}
	return path;
}

function path_short_side() {
	let path = ["M " + p(get("material_thickness"), 0)];

	path.push("h " + get("inner_x"));
	path.push(...path_finger_joint(get("number_of_fingers"), false, true, true));
	path.push("h " + -get("inner_x"));
	path.push(...path_finger_joint(get("number_of_fingers"), !get("flip_stays_the_same"), true, false));
	return [path];
}

function path_long_side() {
	let path = ["M " + p(0, get("material_thickness"))];

	path.push(...path_finger_joint(get("number_of_fingers"), true, false, true));

	for (let i = 0; i < get("number_of_dividers"); ++i) {
		path.push("v " + get("between_cuts"));
		path.push("h " + -get("joint_length"));
		path.push("v " + get("material_thickness"));
		path.push("h " + get("joint_length"));
	}

	path.push("v " + get("between_cuts"));

	path.push(...path_finger_joint(get("number_of_fingers"), get("flip_stays_the_same"), false, false));

	const bottom_length = get("number_of_dividers") * get("distance_between_divider_middle");
	path.push("z");
	return [path];
}

function update_svg() {
	update_svg_by_id("svg_base", path_base());
	update_svg_by_id("svg_long", path_long_side());
	update_svg_by_id("svg_short", path_short_side());
	update_svg_by_id("svg_divider", path_divider());
}

function update_svg_by_id(id , content) {
	let svg = document.getElementById(id);

	while (svg.firstChild) {
		svg.firstChild.remove();
	}

	for (const path of content) {
		var newElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
		newElement.style.stroke = "#000";
		newElement.style.strokeWidth = "0.1";
		newElement.style.fill = "none";
		newElement.setAttribute("d", path.join(" "));
		svg.appendChild(newElement);
	}
}

function create_slider(name, value_object) {
	let slider = document.createElement("input");
	slider.type = "range";
	slider.min = 1;
	slider.max = 99;
	slider.value = value_object.x;

	let s = document.createElement("span");

	let update_value = function() {
		value_object.x = Number(slider.value);
		s.textContent = slider.value;
	};
	slider.oninput = function() {
		update_value();
		calculate();
		update_svg();
	}

	update_value();

	let description = document.createElement("span");
	description.textContent = name;

	let top = document.createElement("div");
	top.appendChild(description);
	top.appendChild(slider);
	top.appendChild(s);
	return top;
}

function DOM_ready() {
	set_up();

	let c = document.getElementById("controls");
	Object.entries(values).forEach(function ([key, value]) {
		// console.log(key);
		// console.log(value);
		c.appendChild(create_slider(key, value));
	});

	calculate();
	// console.log(values);
	update_svg();
}
