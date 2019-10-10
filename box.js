"use strict";

let values = {
};

function get(name) {
	return values[name].x;
}

function set(name, value) {
	values[name] = {x:value, read_only:false};
}

function calc(name, value) {
	values[name] = {x:value, read_only:true};
}

function set_up() {
	set("material_thickness", 4);
	set("card_width", 63);
	set("card_height", 88);

	set("margin_horizontal", 2.5);
	set("margin_top", 4); //material

	set("cut_horizontal", 32);
	set("cut_vertical_straight_depth", 10);
	set("cut_vertical_curve_depth", 32);
	set("cut_small_horizontal", 4);
	set("joint_length_x", 4);
	set("divider_depth_y", 8);
	set("number_of_horizontal_joints", 2);
	set("number_of_dividers", 4);
	set("distance_between_dividers", 20);
}


function calculate() {
	calc("inner_x", get("card_width") + 2 * get("margin_horizontal"));
	calc("inner_y",  get("card_height") + get("margin_top"));
	calc("inner_z", (get("number_of_dividers") + 1) * get("distance_between_dividers") + get("number_of_dividers") * get("material_thickness"));

	calc("outer_x", get("inner_x") + 2 * get("material_thickness"));

	calc("space_between_joints", (get("inner_x") - get("number_of_horizontal_joints") * get("joint_length_x")) / (get("number_of_horizontal_joints") + 1));

	calc("number_of_fingers_x", get("inner_x") / get("material_thickness"));//todo: this MUST be integer
	calc("number_of_fingers_y", get("inner_y") / get("material_thickness"));//todo: this MUST be integer
	calc("number_of_fingers_z", get("inner_z") / get("material_thickness"));//todo: this MUST be integer
	calc("flip_x_must_be_1", (get("number_of_fingers_x") % 2));
	calc("flip_y_must_be_1", (get("number_of_fingers_y") % 2));
	calc("flip_z_must_be_1", (get("number_of_fingers_z") % 2));
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

	path.push("v " + get("divider_depth_y"));
	path.push("h " + -get("material_thickness"));
	const side = get("inner_y") - get("joint_length_x");
	path.push("v " + side);

	for (let i = 0; i < get("number_of_horizontal_joints"); ++i) {
		path.push("h " + -get("space_between_joints"));
		path.push("v " + get("material_thickness"));
		path.push("h " + -get("joint_length_x"));
		path.push("v " + -get("material_thickness"));
	}
	path.push("h " + -get("space_between_joints"));

	path.push("v " + -side);
	path.push("h " + -get("material_thickness"));
	path.push("v " + -get("divider_depth_y"));
	return [path];
}

function path_base() {
	let all_paths = [];
	let path = ["M " + p(get("material_thickness"), 0)];

	path.push(...finger_joint.path_right(get("number_of_fingers_x"), false, false, directions.RIGHT));
	path.push(...finger_joint.path_right(get("number_of_fingers_z") + 2, true, true, directions.DOWN));
	path.push(...finger_joint.path_right(get("number_of_fingers_x"), false, false, directions.LEFT));
	path.push(...finger_joint.path_right(get("number_of_fingers_z") + 2, true, true, directions.UP));
	all_paths.push(path);

	for (let i = 0; i < get("number_of_horizontal_joints"); ++i) {
		for (let j = 0; j < get("number_of_dividers"); ++j) {
			const x_pos = 1 * get("material_thickness") + (i + 1) * get("space_between_joints") + i * get("joint_length_x");
			const z_pos = (j + 1) * (get("distance_between_dividers") + get("material_thickness"));
			let inner_path = ["M " + p(x_pos, z_pos)];
			inner_path.push("h " + get("joint_length_x"));
			inner_path.push("v " + get("material_thickness"));
			inner_path.push("h " + -get("joint_length_x"));
			inner_path.push("v " + -get("material_thickness"));

			all_paths.push(inner_path);
		}
	}

	return all_paths;
}

const directions = {
	LEFT: [false, -1],
	RIGHT: [false, 1],
	UP: [true, -1],
	DOWN: [true, 1]
};

class finger_joint {
	static path_right(number_of_fingers, inside, finger_first, direction) {
		let path = [];

		const vertical = direction[0];
		const increasing = direction[1];

		const main = (vertical ? "v" : "h") + " ";
		const side = (vertical ? "h" : "v") + " ";

		const side_sign = increasing * (inside ? 1 : -1) * (vertical ? 1 : -1);

		for (let i = 0; i < number_of_fingers; ++i) {
			if (finger_first) {
				path.push(side + side_sign * get("material_thickness"));
				path.push(main + increasing * get("material_thickness"));
				path.push(side + (-side_sign) * get("material_thickness"));
			} else {
				path.push(main + increasing * get("material_thickness"));
			}
			finger_first = !finger_first;
		}
		return path;
	}
}

function path_short_side() {
	let path = ["M " + p(get("material_thickness"), get("material_thickness"))];

	path.push(...finger_joint.path_right(get("number_of_fingers_x"), true, false, directions.RIGHT));
	path.push(...finger_joint.path_right(get("number_of_fingers_y"), true, false, directions.DOWN));
	path.push("h " + -get("inner_x"));
	path.push(...finger_joint.path_right(get("number_of_fingers_y"), true, false, directions.UP));
	return [path];
}

function path_long_side() {
	let path = ["M " + p(get("material_thickness"), get("material_thickness"))];

	path.push(...finger_joint.path_right(get("number_of_fingers_y"), true, true, directions.RIGHT));

	for (let i = 0; i < get("number_of_dividers"); ++i) {
		path.push("v " + get("distance_between_dividers"));
		path.push("h " + -get("divider_depth_y"));
		path.push("v " + get("material_thickness"));
		path.push("h " + get("divider_depth_y"));
	}

	path.push("v " + get("distance_between_dividers"));

	path.push(...finger_joint.path_right(get("number_of_fingers_y"), true, true, directions.LEFT));

	path.push(...finger_joint.path_right(get("number_of_fingers_z"), true, true, directions.UP));

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

function create_gui_element(name, value_object, value_name_to_gui, update_gui) {
	let s = document.createElement("span");
	value_name_to_gui[name] = s;

	let description = document.createElement("span");
	description.textContent = name + ":";

	let top = document.createElement("div");
	top.appendChild(description);

	if (!value_object.read_only) {
		let slider = document.createElement("input");
		slider.type = "range";
		slider.min = 1;
		slider.max = 99;
		slider.value = value_object.x;

		let modify_value = function() {
			value_object.x = Number(slider.value);
		};

		slider.oninput = function() {
			modify_value();
			calculate();
			update_gui();
			update_svg();
		}

		top.appendChild(slider);
	}

	top.appendChild(s);
	return top;
}

function DOM_ready() {
	set_up();
	calculate();

	let value_name_to_gui = {
	};

	let update_gui = function() {
		Object.entries(value_name_to_gui).forEach(function ([key, value]) {
			value.textContent = get(key);
		});
	};

	let c = document.getElementById("controls");
	Object.entries(values).forEach(function ([key, value]) {
		// console.log(key);
		// console.log(value);
		c.appendChild(create_gui_element(key, value, value_name_to_gui, update_gui));
	});

	update_gui();

	// console.log(values);
	update_svg();
}
