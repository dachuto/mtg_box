import sys

material_thickness = 4

card_width = 63
card_height = 88

margin_horizontal = 3
margin_top = 6

inner_x = card_width + 2 * margin_horizontal
inner_y = card_height + margin_top

outer_x = inner_x + 2 * material_thickness

cut_horizontal = 32
cut_vertical_straight_depth = 10
cut_vertical_curve_depth = 32
cut_small_horizontal = 4

joint_length = 6
number_of_horizontal_joints = 2
space_between_joints = (inner_x - (number_of_horizontal_joints * joint_length)) / (number_of_horizontal_joints + 1)

def p(x):
	return str(x[0]) + "," + str(x[1])


def function():
	path = []
	half_outer_x_without_cut = (outer_x - cut_horizontal - 2 * cut_small_horizontal) / 2

	path.append("h " + str(half_outer_x_without_cut))

	path.append("q " + p((cut_small_horizontal, 0)) + " " + p((cut_small_horizontal, margin_top)))
	path.append("v " + str(cut_vertical_straight_depth))
	path.append("c " + p((0, cut_vertical_curve_depth)) + " " + p((cut_horizontal, cut_vertical_curve_depth)) + " " + p((cut_horizontal, 0)))
	path.append("v " + str(-cut_vertical_straight_depth))
	path.append("q " + p((0, -margin_top)) + " " + p((cut_small_horizontal, -margin_top)))

	path.append("h " + str(half_outer_x_without_cut))

	path.append("v " + str(joint_length))
	path.append("h " + str(-material_thickness))
	horizontal_side = inner_y - joint_length
	path.append("v " + str(horizontal_side))

	for i in range(number_of_horizontal_joints):
		path.append("h " + str(-space_between_joints))
		path.append("v " + str(material_thickness))
		path.append("h " + str(-joint_length))
		path.append("v " + str(-material_thickness))
	path.append("h " + str(-space_between_joints))

	path.append("v " + str(-horizontal_side))
	path.append("h " + str(-material_thickness))
	path.append("v " + str(-joint_length))

	for k in path:
		sys.stdout.write(k + " ")

if __name__ == "__main__":
	function()
