function set_state () {
	var tb_value = document.getElementById("state-textbox").value
	if (tb_value == "YEET") {
		alert("YEET") // Here you go jaren
	}
	if (tb_value != "") { // State textbox is not blank, assume user wants use that
		if (Object.keys(states).includes(tb_value.toUpperCase())) { // state code is valid
			document.getElementById("state-dropdown").querySelector(`option[value=${tb_value.toUpperCase()}]`).selected = true // This only works on reasonably modern browsers. If you ever need to support older browsers traverse state-dropdown manually
		} else if (Object.values(states).includes(tb_value.charAt(0).toUpperCase() + tb_value.substring(1).toLowerCase())) { // State name is valid
			for (var node of document.getElementById("state-dropdown").children) {
				if (node.innerText == tb_value.charAt(0).toUpperCase() + tb_value.substring(1).toLowerCase()) {
					node.selected = true
					break
				}
			}
		}
	}
	process_ror()
}
function calculate_ineligible_days (start, finish) {
	var dayMilliseconds = 1000 * 60 * 60 * 24
	days = []
	while (start.getTime() <= finish.getTime()) {
		var day = start.getDay();
		// check if its a sunday
		if (day == 0) {
				days.push("Sunday")
		} else { // Needs to be in an else, in case the holiday is both a sunday and a holiday so we dont add 2
      for (var holiday of holidays) {
        if (holiday.day == start.getDate() && holiday.month == start.getMonth()+1) {
          days.push(holiday.name) // TODO: break after this since multiple holidays on the same day wouldn't count as 2 holidays (cant happen anyway)
        }
      }
    }
    start = new Date(+start + dayMilliseconds);
  }
  console.log(days)
	return days
}
function process_ror () {
	is_professional = document.getElementById("InstallType").getElementsByTagName("input")[0].checked
	age = document.getElementById("age").getElementsByTagName("input")[0].value
	state_code = document.getElementById("state-dropdown").value
	is_professional = document.getElementById("InstallType").getElementsByTagName("input")[0].checked
	assisted_living = document.getElementById("assisted").getElementsByTagName("input")[0].checked
	install_date = document.getElementById("InstallDate").querySelector("input").value
	// make sure we are showing the right cards
	if (is_professional) { // professional install
		document.getElementById("age").style.display = "block"
		document.getElementById("state").style.display = "block"
		if (state_code == "NY") {
			document.getElementById("assisted").style.display = "block"
			document.getElementById("age").style.display = "none"
		} else {
			document.getElementById("assisted").style.display = "none"
		}
	} else { // DIY install
		document.getElementById("assisted").style.display = "none"
		document.getElementById("age").style.display = "none"
		document.getElementById("state").style.display = "none"
	}
	// actually calculate the ROR, starting with figuring out the base ROR period
	if (is_professional) { // There are a ton of exceptions for professional installs. Work out if there is an exception, use 3 if not
		if (state_code == "none" || (age == "" && state_code != "NY")) {
			document.getElementById("output").querySelector("h1").innerText = "Not enough info (Please fill out the rest of the form)"
			document.getElementById("subtext").innerText = ""
			document.getElementById("accounting-for").innerText = ""
			set_output_color("yellow")
			return
		}
		base_period = 3
		if (age >= 75) {
			base_period = 30 // this may be brought back down by an exception if the customer is in an exception state
		}
		if (state_code == "AK") {
			base_period = 3
		}
		if (state_code == "AR") {
			base_period = 30
		}
		if (state_code == "MD") {
			base_period = 5
			if (age >= 65) {
				base_period = 7
			}
		}
		if (state_code == "ND") {
			base_period = 3
			if (age >= 65) {
				base_period = 15
			}
		}
		if (state_code == "NY") {
			base_period = 7
			if (assisted_living) {
				base_period = 30
			}
		}
    if (typeof TestBasePeriod != "undefined") {
      base_period = TestBasePeriod
    }
	} else {
		base_period = 30
		document.getElementById("subtext").innerText = ""
		document.getElementById("accounting-for").innerText = ""
		set_output_color("yellow")
	}
	document.getElementById("output").querySelector("h1").innerText = base_period + " days"
	if (Date.now() < Date.parse(install_date)) { // Technically generally Date.parse() is discouraged due to inconsistency across browsers, but the input is coming from a date input which will always work from within the same browser
		document.getElementById("subtext").innerText = "Entered date is in the future"
		document.getElementById("accounting-for").innerText = ""
		set_output_color("yellow")
		return
	}
	ror_end_date = new Date(Number(Date.parse(install_date))) // https://codewithhugo.com/add-date-days-js/
	ror_end_date.setDate(ror_end_date.getDate() + base_period + 1) // https://codewithhugo.com/add-date-days-js/ also add 1 more day because it shouldn't include the actual install date
  // process sundays/holidays
  if (is_professional) {
    if (install_date == "") { // we don't know when the system was installed, not possible to account for sundays/holidays
      document.getElementById("subtext").innerText = "Please enter an install date to account for sundays/holidays"
	  document.getElementById("accounting-for").innerText = ""
      return
    } else {
	  non_valid_days = calculate_ineligible_days(new Date(install_date), ror_end_date)
      base_period = base_period + non_valid_days.length
      document.getElementById("output").querySelector("h1").innerText = base_period + " days" // Update this since we know more about the base term
    }
    ror_end_date = new Date(Number(Date.parse(install_date))) // do this again now that we have a new base term
    ror_end_date.setDate(ror_end_date.getDate() + base_period + 1) // do this again now that we have a new base term
    // Display end date
    if (new Date() > ror_end_date) {
      set_output_color("red")
      document.getElementById("subtext").innerText = "ROR ended on " + ror_end_date.toDateString()
    } else {
      set_output_color("green")
      document.getElementById("subtext").innerText = "ROR until " + ror_end_date.toDateString()
    }
	if (non_valid_days.length == 0) {
		document.getElementById("accounting-for").innerText = ""
	} else {
		document.getElementById("accounting-for").innerText = "Accounting for " + non_valid_days.join(", ")
	}
	
  }
}
function clear_form () {
	for (var node of document.querySelectorAll("input")) {
		if (node.type == "text") {
			node.value = ""
		}
		if (node.type == "checkbox") {
			node.checked = false
		}
		if (node.type == "date") {
			node.value = ""
		}
	}
}
function set_output_color(color) {
	if (color == "green") {
		document.getElementById("output").style.backgroundColor = "#3bf23b"
	} else if (color == "yellow") {
		document.getElementById("output").style.backgroundColor = "yellow"
	} else if (color == "red") {
		document.getElementById("output").style.backgroundColor = "#e33030"
	}
}
window.onload = function () {
	// clear the form as some browsers will save it
	clear_form()
	document.getElementById("state-textbox").onkeyup = set_state
	document.getElementById("state-dropdown").onchange = process_ror
	for (var state of Object.keys(states)) {
		node = document.createElement("option")
		node.innerText = states[state]
		node.setAttribute("value", state)
		document.getElementById("state-dropdown").appendChild(node)
	}
}
states = {
	"AL": "Alabama",
	"AK": "Alaska",
	"AZ": "Arizona",
	"AR": "Arkansas",
	"CA": "California",
	"CO": "Colorado",
	"CT": "Connecticut",
	"DE": "Delaware",
	"DC": "District of Columbia",
	"FL": "Florida",
	"GA": "Georgia",
	"HI": "Hawaii",
	"ID": "Idaho",
	"IL": "Illinois",
	"IN": "Indiana",
	"IA": "Iowa",
	"KS": "Kansas",
	"KY": "Kentucky",
	"LA": "Louisiana",
	"ME": "Maine",
	"MD": "Maryland",
	"MA": "Massachusetts",
	"MI": "Michigan",
	"MN": "Minnesota",
	"MS": "Mississippi",
	"MO": "Missouri",
	"MT": "Montana",
	"NE": "Nebraska",
	"NV": "Nevada",
	"NH": "New Hampshire",
	"NJ": "New Jersey",
	"NM": "New Mexico",
	"NY": "New York",
	"NC": "North Carolina",
	"ND": "North Dakota",
	"OH": "Ohio",
	"OK": "Oklahoma",
	"OR": "Oregon",
	"PA": "Pensylvania",
	"RI": "Rhode Island",
	"SC": "South Carolina",
	"SD": "South Dakota",
	"TN": "Tennessee",
	"TX": "Texas",
	"UT": "Utah",
	"VT": "Vermont",
	"VA": "Virginia",
	"WA": "Washington",
	"WV": "West Virginia",
	"WI": "Wisconsin",
	"WY": "Whyoming"
}

// holiday shenanigans
day_ints = {"Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6}
function floating_holiday(name, week, weekday, month) { // Note from self about halfway thru writing this function: kill me please
  if (typeof weekday == "string") {
    weekday = day_ints[weekday]
  }
  output_week = 0
  current_day = 0
  for (day=1; day<new Date(new Date().getFullYear(), month, 0).getDate()+1; day++) { // specifying 0 as the date gets the last date in the month. this makes it easy to iterate thru every possible day in the month
    let date = new Date(new Date().getFullYear(), month-1, day)
    if (date.getDay() == weekday) { // the day we are currently looking at is the same day of the week as the day we are trying to find
      output_week++
      current_day = day // Need to store this in case we are looking for the last occurance
      if (typeof week == "number") { // if the output week is "last", we just keep counting until we've gone thru every day in the month. The code for that is therfore after this loop
        if (output_week == week) { // we found the exact day! Stop counting
          break
        } 
      }
    }
  }
  if (week != "last" && typeof week != "number") {
      alert("ERROR: Week of floating holiday " + name + " not understood (" + week + "). Please report this to Gradyn Wursten so I can fix it")
      return
  }
  return {"name":name, "month":month, day:current_day}
}
holidays = [
	{"name": "New Years Eve", "month": 12, "day": 31},
	{"name": "New Years Day", "month": 1, "day": 1},
  floating_holiday("Martin Luther King Jr. Day", 3, "Monday", 1),
  floating_holiday("Washingtons Birthday", 3, "Monday", 2),
  floating_holiday("Memorial Day", "last", "Monday", 5),
  {"name": "Independance Day", "month": 7, "day": 4},
  {"name": "Pioneer Day", "month": 7, "day": 24},
  floating_holiday("Labor Day", 1, "Monday", 9),
  floating_holiday("Columbus Day", 2, "Monday", 10),
  {"name": "Veterans Day", "month": 11, "day": 11},
  floating_holiday("Black Friday", 3, "Friday", 11), // It is not possible for thanksgiving to fall on the 31st, so this is fine.
  floating_holiday("Thanksgiving", 3, "Thursday", 11),
  {"name": "Christmas Eve", "month": 12, "day": 24},
  {"name": "Christmas", "month": 12, "day": 25}
]