$(document).ready(function(){
  console.log("heyo, here be secrets");

  attributes = ["-ATTRIBUTES-", "Strength","Dexterity", "Stamina", "Charisma", "Manipulation", "Composure", "Intelligence" , "Wits", "Resolve"];
  skills = ["-SKILLS-", "-PHYSICAL-", "Athletics","Brawl","Craft","Drive","Firearms","Melee","Larceny","Stealth","Survival",
    "-SOCIAL-", "Animal Ken","Etiquette","Insight","Intimidation","Leadership","Performance","Persuasion","Streetwise","Subterfuge",
    "-MENTAL-", "Academics","Awareness","Finance","Investigation","Medicine","Occult","Politics","Science","Technology"];

  massCreateSkills(["Athletics","Brawl","Craft","Drive","Firearms","Melee","Larceny","Stealth","Survival"],"physical")
  massCreateSkills(["Animal Ken","Etiquette","Insight","Intimidation","Leadership","Performance","Persuasion","Streetwise","Subterfuge"],"social");
  massCreateSkills(["Academics","Awareness","Finance","Investigation","Medicine","Occult","Politics","Science","Technology"],"mental");

  createOptions(attributes, "#roll1");
  createOptions(skills, "#roll2");
  createOptions(attributes.concat(skills), "#roll3");

  $("#save").on("click", saveCharacter);
  $("#load").on("click", sendLoadRequest);
  $("input:checkbox").on("click", changeValue);
  $(".roll").on("click", rollStatic);
  $("#rollSkills").on("click", rollDynamic);
  $("#chat-send").on("click", sendMessage);
  $("#chat-write").on('keypress',function(e) {
    if(e.which == 13) {
        $("#chat-send").click();
    }
  });

  //const socket = io('localhost:3080');
  var socket = io();//.connect('localhost:3001');

  socket.on("connect", () => {
    console.log("Connected as " + socket.id); // x8WIv7-mJelg7on_ALbx
    socket.emit('newUser', socket.id);
  });

  socket.on("disconnect", () => {
    console.log(socket.id + " DJSCONNECTED"); // undefined
  });

  socket.on('message', (msg) => {
    receiveMessage(msg);
  });

  socket.on("characterStats", (characterStats) => {
    loadCharacter(characterStats);
  });


  function massCreateSkills(names, attribute) {
    for (n in names) {
      createSkill(names[n], attribute);
    }
  }

  function createOptions(list, target) {
    $parent = $(target);
    for ( opt in list ) {
      if (list[opt].includes("-")) {
        $parent.append($("<option disabled value=\"-\">"+ list[opt] + "</option>"));
      } else {
        $parent.append($("<option value=\""+ list[opt].toLowerCase() + "\">"+ list[opt] + "</option>"));
      }
    }
  }

  function createSkill(name, attribute) {
    let id = "";
    if (name.includes(" ")){
      let t = name.split(" ");
      id = (t[0] + "_" + t[1]).toLowerCase();
    } else {
      id = name.toLowerCase();
    }
    let $parent = $(".skill-"+attribute);
    $div = $("<div class=\"skill-wrapper\"></div>");
    $div.append($("<label for=\"" + name.toLowerCase() + "\">"+ name +"</label>"));
    for (let i=1; i<=5; i++) {
      $check = $("<input type=\"checkbox\" id=\"" + id  + "-" + i +"\" name=\"" + name.toLowerCase() +"\">");
      $div.append($check);
    }
    $parent.append($div);
  }

  function d(num) {
    return Math.floor(Math.random() * num) + 1;
  }

  function rollStatic() {
    let amount = $(".dicepool").val();
    console.log("Using static dicepool = " + amount);
    rollDice(amount);
  }

  function rollDynamic() {
    let pool1 = $("#roll1").val();
    let pool2 = $("#roll2").val();
    let pool3 = $("#roll3").val();
    let sum = 0;

    if (pool1 !== "-") {
      sum += getValue(pool1);
    }
    if (pool2 !== "-") {
      sum += getValue(pool2);
    }
    if (pool3 !== "-") {
      sum += getValue(pool3);
    }
    console.log("Using DYNAMIC dicepool = " + sum);
    rollDice(sum);
  }

  function rollDice(amount) {
    let hunger = getValue("hunger");
    let results = [];
    results['regular'] = [];
    results['hunger'] = [];

    console.log("rolling " + amount + " D10 of which " + hunger +" are hunger dice");
    let regularDice = amount-hunger;
    if (hunger - amount > 0) {
      hunger = amount;
    }
    let resultString = "";
    if (regularDice <= 0) {
      regularDice = 0;
    }
    for (let i=0; i < regularDice; i++) {
      let dice = d(10);
      resultString+= dice + ", ";
      results['regular'].push(dice);
    }
    resultString += ". HUNGER: ";
    for (let i=0; i < hunger; i++) {
      let dice = d(10);
      resultString+= dice + ", ";
      results['hunger'].push(dice);
    }
    console.log(resultString)
    console.log(results);
    showDice(results);
  }

  function showDice(resultArray) {
    let count = 0;
    let sum = 0;
    let crits = 0;
    let regCrits = 0;
    let resultString = "";
    let amountDice = resultArray["regular"].length + resultArray["hunger"].length;
    console.log("Amount dice = " + amountDice + " regular length = " + resultArray["regular"] + " + " + resultArray["hunger"]);
    $(".dice-result h2").html("");
    for (let i = 1; i<$(".dice").length; i++) {
      if (i<amountDice) {
        $($(".dice")[i]).addClass("rolling");
        $($(".dice")[i]).css("visibility", "visible");
      } else {
        $($(".dice")[i]).css("visibility", "hidden");
      }
    }
    for (res in resultArray['regular']) {
      count++;
      if (resultArray['regular'][res] == 10) {
        regCrits++;
        crits++;
      } else {
        if (resultArray['regular'][res] > 5) {
          sum++;
        }
      }
      cascadeAnimation(count, resultArray['regular'][res], "black");
    }
    for (res in resultArray['hunger']) {
      count++;
      if (resultArray['hunger'][res] == 10) {
        crits++;
      } else {
        if (resultArray['hunger'][res] > 5) {
          sum++;
        }
      }
      cascadeAnimation(count, resultArray['hunger'][res], "red");
    }

    if (resultArray['hunger'].includes(1)) {
      if (resultArray['hunger'].every(function (e) {
        return e <=5;
      })) {
        console.log("BESTIAL FAILURE");
        resultString = "Bestial Failure";
      }
    }
    if (resultArray['hunger'].includes(10)) {
      if (crits >=2) {
        console.log("MESSY CRITICAL");
        resultString = "Messy Critical";
      }
    } else if (resultArray["regular"] && regCrits >=2) {
      console.log("CRITICAL SUCCESS");
      resultString = "Critical Success";
    }
    console.log("CRITS : " + crits);

    if (crits >= 2) {
      sum+= (Math.floor(crits/2)*4) + crits%2;
    }
    if (crits == 1) {
      sum++;
    }
    console.log("SUCCESSES: " + sum);
    resultString +="</br>Successes: " + sum;
    setTimeout(function () {$(".dice-result h2").html(resultString);},count*140);
    //$(".dice-result").html(resultString);
  }

  function cascadeAnimation(n, result, color) {
    setTimeout( function() {
      animateDice(n, result, color);
    },150*n);
  }

  function animateDice(n, result, color){
    $("#dice"+n).removeClass( "red black rolling" );
    $("#dice"+n).addClass(color);
    $("#dice"+n).css("visibility", "visible");
    $("#dice"+n+"-span").html(result);
  }
  /*
  function rollDice2() {
    let pool1 = $("#roll1").val();
    let pool2 = $("#roll2").val();
    let pool3 = $("#roll3").val();
    let results = [];
    let sum = 0;
    results['regular'] = [];
    results['hunger'] = [];
    console.log(pool1);

    if (pool1 !== "-") {
      sum += getValue(pool1);
    }
    if (pool2 !== "-") {
      sum += getValue(pool2);
    }
    if (pool3 !== "-") {
      sum += getValue(pool3);
    }
    console.log("Using DYNAMIC dicepool = " + sum);

    let amount = sum;
    let hunger = getValue("hunger");
    console.log("rolling " + amount + " D10 of which " + hunger +" are hunger dice");
    let regularDice = amount-hunger;
    if (hunger - amount > 0) {
      hunger = amount;
    }
    let resultString = "";
    if (regularDice <= 0) {
      regularDice = 0;
    }
    for (let i=0; i < regularDice; i++) {
      let dice = d(10);
      resultString+= dice + ", ";
      results['regular'].push(dice);
    }
    resultString += ". HUNGER: ";
    for (let i=0; i < hunger; i++) {
      let dice = d(10);
      resultString+= dice + ", ";
      results['hunger'].push(dice);
    }
    console.log(resultString)
    showDice(results);
  } */

  function getValue(name) {
    let current = 0;
    for (let i= 1; i <=5; i++) {
      if ($("#" + name + "-" + i).prop( "checked") == true) {
        current = i;
      }
    }
    return current;
  }

  function changeValue() {
    let change = false;
    let name = $(this)[0].id;
    let num = name.split("-")[1];
    name = name.split("-")[0];
    let current = 1;
    for (let i= 1; i <=5; i++) {
      if ($("#" + name + "-" + i).prop( "checked") == true) {
        current = i;
      }
    }
    for (let i = 1; i <= 5; i++) {
      if (num >= i) {
        $("#" + name + "-" + i).prop( "checked", true );
      }
      if (num < i) {
        $("#" + name + "-" + i).prop( "checked", false );
      }
    }

    if (current == 1 && num == 1) {
      $("#" + name + "-1").prop( "checked", false );
      console.log(current + " == " + num + " == 1");
    }
  }

  function setValue(id, val) {
    for (let i=1; i <= 5; i++) {
      if (i <= val) {
        $("#" + id + "-" + i).prop("checked", true);
      } else {
        $("#" + id + "-" + i).prop("checked", false);
      }
    }
  }

  function setStringValue(id, val) {
    $("#" + id).val(val);
  }

  function sendMessage() {
    let msg = $("#chat-write").val();
    $("#chat-write").val("");
    let content = $("#chat").val();
    content += "\n<"+$("#name").val()+">: " + msg;
    //$("#chat").val(content);
    socket.emit('message', "<"+$("#name").val()+">: " + msg);
  }

  function receiveMessage(msg) {
    let content = $("#chat").val();
    //content += "\n<"+$("#name").val()+">: " + msg;
    content += "\n" + msg;

    $("#chat").val(content);
  }

  function saveCharacter() {
    console.log("Saving character stats");
    var character = {
           name : $("#name").val(),
           player : $("#player").val(),
           chronicle : $("#chronicle").val(),
           concept : $("#concept").val(),
           ambition : $("#ambition").val(),
           predator : $("#predator").val(),
           sire : $("#sire").val(),
           clan : $("#clan").val(),
           generation : $("#generation").val(),

           strength : getValue("strength"),
           dexterity : getValue("dexterity"),
           stamina : getValue("stamina"),
           charisma : getValue("charisma"),
           manipulation : getValue("manipulation"),
           composure : getValue("composure"),
           intelligence : getValue("intelligence"),
           wits : getValue("wits"),
           resolve : getValue("resolve"),

           athletics : getValue("athletics"),
           brawl : getValue("brawl"),
           craft: getValue("craft"),
           drive: getValue("drive"),
           firearms: getValue("firearms"),
           melee: getValue("melee"),
           larceny: getValue("larceny"),
           stealth: getValue("stealth"),
           survival: getValue("survival"),

           animal_ken: getValue("animal_ken"),
           etiquette: getValue("etiquette"),
           insight: getValue("insight"),
           intimidation: getValue("intimidation"),
           leadership: getValue("leadership"),
           performance: getValue("parformance"),
           persuasion: getValue("persuasion"),
           streetwise: getValue("streetwise"),
           subterfuge: getValue("subterfuge"),

           academics: getValue("academics"),
           awareness: getValue("awareness"),
           finance: getValue("finance"),
           investigation: getValue("investigation"),
           medicine: getValue("medicine"),
           occult: getValue("occult"),
           politics: getValue("politics"),
           science: getValue("science"),
           technolog: getValue("technology")
           };
    console.log("stats fetched");
    console.log(character);
    socket.emit("save", character);
  }

  function sendLoadRequest() {
    let player = $("#player").val();
    console.log("SENDING LOAD REQUEST TO SERVER FOR " + player);
    socket.emit("load", player);
    console.log("Request sent");
  }

  function loadCharacter(stats) {
    console.log("STATS RECEIVED VIA characterStats:");
    console.log(stats);
    for (const [key, value] of Object.entries(stats)) {
      console.log(key, value);
      if (Number.isInteger(value)) {
        setValue(key, value);
      } else {
        setStringValue(key, value);
      }

    }
  }

});
