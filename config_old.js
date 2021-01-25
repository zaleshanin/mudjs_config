/*
https://raw.githubusercontent.com/dreamland-mud/mudjs/dreamland/defaults.js

* Подробнее см. https://github.com/dreamland-mud/mudjs/wiki/MUD-prompt
 * Расшифровка аффектов: https://github.com/dreamland-mud/mudjs/blob/dreamland/src/prompt.js

*/
var test = false;
var match;
var bot = false;

var chars = {
	miyamoto: {
    	name: 'Miyamoto',
    	namerus: 'Миямото',
    	weapon: 'heavy',
    	class: 'necromancer',
    	clan: 'invader',
    	water: 'spring',//'flask',
    	food: 'mushroom'
	},
	zaleshanin: {
    	name: 'Zaleshanin',
    	namerus: 'Залешанин',
    	weapon: 'frozen',
    	class: 'thief',
    	clan: 'none',
    	water: 'flask',//'flask',
    	food: 'rusk'
	}
};
var charnames = {
	'Миямото': 'miyamoto',
	'Miyamoto': 'miyamoto',
	'Залешанин': 'zaleshanin',
	'Zaleshanin': 'zaleshanin'
};

var buffQueue = [];


var pchar = {init: false};


//-----------------------------------------------------
// Пример тригера
$('.trigger').on('text', function (e, text) {
	if(bot && pchar.init) {

	}
	if(text.match('Обессилев, ты падаешь лицом вниз!')) {
    	echo('-->ЕЩЕ РАЗОК!!!\n');
    	send('stand|bashdoor n');
	}
	/*
	Капитан просовывает палец через дырку в шляпе.

	<морячокак Залешанин:112/112 145/145 124/124 [ ][S]>
	Капитан произносит 'Похоже, дварф в прошлый раз не слишком хорошо ее подлатал.'

	<морячокак Залешанин:112/112 145/145 124/124 [ ][S]>
	Капитан произносит 'Можешь подсобить мне еще раз?'

	<морячокак Залешанин:112/112 145/145 124/124 [ ][S]>say yes
	Ты произносишь 'yes'
	Капитан вручает тебе свою шляпу.
	Ты даешь шляпу капитана дварфу.

	<морячокак Залешанин:112/112 145/145 124/124 [ ][S]>Дварф произносит 'Ого, тебе доверили подержать шляпу капитана!'

	<морячокак Залешанин:112/112 145/145 124/124 [ ][S]>
	Дварф произносит 'Похоже, она опять нуждается в ремонте.'

	<морячокак Залешанин:112/112 145/145 124/124 [ ][S]>
	Дварф ремонтирует шляпу капитана.

	<морячокак Залешанин:112/112 145/145 124/124 [ ][S]>
	Дварф возвращает тебе шляпу капитана.
	Ты даешь шляпу капитана Капитану.
	Капитан произносит 'Благодарю тебя, морячокак Залешанин!'
	Капитан дает тебе 10 золотых.
	* */
	if (text.match('^Ты слышишь протяжное мяяяяуууу за спиной, а когда оборачиваешься, обнаруживаешь Bast.$')) {
    	echo('-->(pinch bast)\n');
    	//send('pinch bast');
	}
	if (text.match('^Ты растворяешься в воздухе.$')) {
    	echo('-->WHO\n');
    	send('who');
	}
	match = (/^<(?:.* )?(.*):([0-9]{1,5})\/([0-9]{1,5}) ([0-9]{1,5})\/([0-9]{1,5}) ([0-9]{1,5})\/([0-9]{1,5}) \[(.*)]\[.*]>$/).exec(text);
	if (match) {
    	if(test) echo('prompt ok\n');
    	if (!pchar.init) {
        	charInit(match[1]);
    	}
    	if (pchar.init) {
        	pchar.mode = 1;
        	checking();
    	}
	}

	if (pchar.init) {
    	match = (/^<([0-9]{1,5})\([0-9]{1,3}%-([0-9]{1,3})%\) ([0-9]{1,5}) ([0-9]{1,5}) \[(.*)]\[.*]>$/).exec(text);
    	if (match) {
        	pchar.mode = 2;
        	checking();
    	}

    	if (text.match('^Ты не можешь сконцентрироваться.$')
        	|| text.match('^Твоя попытка закончилась неудачей.$')) {
        	clearAction();
    	}
    	if (text.match('^Ok\.$')) {
        	if(test) echo('-->"Ok." match!!!<--\n');
        	if (pchar.action.act !== undefined) {
            	if (pchar.action.act==='order') {
                	clearAction();
            	}
        	}
    	}

    	// проверяем АФФЕКТЫ
    	if (text.match('^Ты находишься под действием следующих аффектов:')
        	|| text.match('^Ты не находишься под действием каких-либо аффектов.')
        	|| text.match('^Ты под воздействием ')) {
        	if (pchar.action.act !== undefined && pchar.action.act === 'affects') {
            	clearAction();
            	pchar.buffsInit = true;
        	}
        	clearBuffs();
    	}

    	match = (/^Аффект: (.*?)[\s]*: /).exec(text);
    	if (match) {
        	buffQueue.push(new BuffQueue(match[1], true, false, pchar.action));
    	}

    	buffPatterns.forEach(function (elem) {
        	if (pchar.spells[elem[0]] !== undefined) {
            	if (text.match(elem[1])) {
                	pchar.affChanged = true;
                	buffQueue.push(new BuffQueue(elem[0], elem[2], elem[3], pchar.action));
                	if (pchar.action.command !== undefined
                    	&& pchar.action.command === 'cancellation')
                    	clearAction();
            	}
        	}
    	});

    	if (text.match('^Ты уже защищен.$')) {
        	buffQueue.push(new BuffQueue(pchar.action.command, true, true, pchar.action));
    	}
    	// закончили проверять АФФЕКТЫ

    	//needs
    	if (text.match('^Ты ешь .*\.$') || text.match('^У тебя нет этого.$') || text.match('^Это несъедобно.$')) {
        	if (pchar.action.act !== undefined) {
            	if (pchar.action.act === 'eat') {
                	clearAction();
            	}
            	pchar.lfood = false;
        	}
    	}
    	if (text.match('^Ты больше не чувствуешь голода.$')) {
        	pchar.hunger = 0;
        	pchar.needsChanged = true;
    	}
    	if (text.match('^Ты хочешь есть.$')) {
        	pchar.hunger++;
        	pchar.needsChanged = true;
    	}
    	if (text.match('^Ты умираешь от голода!$')) {
        	pchar.hunger = 10;
        	pchar.needsChanged = true;
    	}
    	if (text.match('^Ты взмахиваешь руками, и с неба падает манна небесная.$')
        	|| text.match('^Ты берешь соленый сухарик из пакета сухарей.$')
        	|| text.match('^Ты взмахиваешь руками и создаешь магический гриб.$')
    	) {
        	pchar.lfood = 1;
        	pchar.needsChanged = true;
        	if (pchar.action.command === 'create food'
            	|| (pchar.action.act == 'get' && pchar.action.command === pchar.food))
            	clearAction();
    	}

    	if (text.match(' родник высыхает.$')) {
        	pchar.lwater = false;
    	}
    	if (text.match('^Ты не находишь это.$') || text.match('^Здесь пусто.$')) {
        	if (pchar.action.act !== undefined)
            	if (pchar.action.act === 'drink') {
                	clearAction();
            	}
        	pchar.lwater = false;
    	}
    	if (text.match('^Ты хочешь пить.$')) {
        	pchar.thirst++;
        	pchar.needsChanged = true;
        	// echo('[буль-буль:' + pchar.thirst + ']\n');
    	}
    	if (text.match('^Ты умираешь от жажды!$')) {
        	pchar.thirst = 10;
        	pchar.needsChanged = true;
        	// echo('[буль-буль:' + pchar.thirst + ']\n');
    	}
    	if (text.match(' родник пробивается сквозь землю.$')
        	|| text.match('^Жестяная фляга наполнена.$')) {
        	pchar.lwater = 1;
        	if (pchar.action.command == 'create spring' || pchar.action.command == 'create water')
            	clearAction();
    	}
    	if (text.match('^Ты пьешь воду из')) {
        	if (pchar.action.act == 'drink')
            	clearAction();
    	}
    	if (text.match('^Ты больше не чувствуешь жажды.$')) {
        	pchar.thirst = 0;
        	pchar.lwater = false;
        	pchar.needsChanged = true;
    	}

    	if (text.match('^Ты ложишься спать .*?\.$')
        	|| text.match('^Ты уже спишь.$')
        	|| text.match('^Ты засыпаешь.$')
        	|| text.match('^Во сне? Или может сначала проснешься...$')) {
        	pchar.pose = 2;
        	//clearAction();
    	}

    	if (text.match('^Ты садишься отдыхать.$') || text.match('^Ты садишься .*$') || text.match('^Уфф\.\.\. Но ведь ты отдыхаешь\.\.\.$')) {
        	pchar.pose = 1;
        	//clearAction();
    	}
    	if (text.match('^Ты просыпаешься и встаешь.$')
        	|| text.match('^Ты уже стоишь.$') || text.match('^Ты встаешь.$') || text.match('^Ты уже сражаешься!$')) {
        	pchar.pose = 0;
        	clearAction();
    	}
    	if (text.match(' у тебя оружие, и оно упало на землю!$')) {
        	pchar.eqChanged = true;
        	pchar.armed = 0;
        	if (test) echo('(armed=0)\n');
    	}
    	if (text.match(' ВЫБИЛ.? у тебя оружие!$')) {
        	pchar.eqChanged = true;
        	pchar.armed = 1;
        	if (test) echo('(armed=1)\n');
    	}
    	if (pchar.action.act === '\\get' && pchar.action.command === pchar.weapon && text.match('^Ты берешь .*\.$')) {
        	clearAction();
        	if (pchar.armed === 0)
            	pchar.armed = 1;
    	}
    	if (text.match('^Ты вооружаешься .*\.$')) {
        	if (pchar.action.act === '\\wield' && pchar.action.command === pchar.weapon)
            	clearAction();
        	pchar.armed = 2;
    	}
    	if (text.match('^Маленький (белый|черный) крысенок появился в этом мире, вслед за хозяином.$')) {
        	pchar.group.push({name: 'rat', buffs: {}});
    	}
    	if (text.match('^Страж особого назначения вытягивается в струнку.$')) {
        	var lFoundGuard = false;
        	var lFoundSndGuard = false;
        	pchar.group.forEach(function (member) {
            	if (member.name == 'guard')
                	lFoundGuard = true;
            	if (member.name == '2.guard')
                	lFoundSndGuard = true;
        	});
        	if (!lFoundSndGuard)
            	pchar.group.push({name: (lFoundGuard ? '2.guard' : 'guard'), buffs: {}});
    	}
    	if (text.match('^Железный голем подчиняется твоему приказу.$')) {
        	pchar.group.push({name: 'iron', buffs: {}});
    	}
    	if (text.match('^Каменный голем подчиняется твоему приказу.$')) {
        	var golName = '.stone';
        	for(var i=1; i<=3; i++) {
            	var found = false;

            	pchar.group.forEach(function (member) {if(member.name===''+i+golName) found=true;});
            	if(found===false) {
                	golName = ''+i+golName;
                	break;
            	}
        	}
        	pchar.group.push({name: golName, buffs: {}});
    	}
    	if (text.match('^Ночная тень преклоняет перед тобой колени.$')) {
        	pchar.group.push({name: 'nightwalker', buffs: {}});
    	}
    	if (text.match('^Призванная тень подчиняется твоему приказу.$')) {
        	pchar.group.push({name: 'shadow', buffs: {}});
    	}

	}
	/*Большая булава Miyamoto тонет в воде.
	Ты не видишь здесь mace.*/

	if(text.match('^Пруль появился')) {
    	send('l prool');
	}
	if (!text.match('^Тихий голос из хрустального шара: Prool |^Валькирия |^Русалка |^The Ofcol cityguard |^Стражник |^Водяной |^The weaponsmith |^Архивариус |^Мальчик |^Булочник |^Колдун |^Ювелир |^Хассан |^Охранник султана |^Продавец доспехов |^Оружейник |^Бакалейщик ')
    	&& (
        	text.match('^\\[ic\\] ') ||
        	text.match('^\\[ooc\\] ') ||
        	text.match(' говорит тебе \'.*\'$') ||
        	text.match(' произносит \'.*\'$') ||
        	text.match('^\\[RULER\\].*$') ||
        	text.match('^\\Тихий голос из хрустального шара:\\ .*$') ||
        	text.match('\\ поздравляет \'.*\'$')
    	)
	) {
    	notify(text);
    	/*
            	if(pchar.messages!==undefined) {
                	pchar.messages.push(text);
                	pchar.messagesCounter++;
            	}
    	*/
	}
});

//-----------------------------------------------------
// Пример алиаса
$('.trigger').on('input', function (e, text) {
	var match;

	match = (/^b2c (.*)/).exec(text);
	if (match) {
    	send('get ' + match[1] + ' bag|put ' + match[1] + ' casket');
    	e.stopPropagation();
	}

	match = (/^b2i (.*)/).exec(text);
	if (match) {
    	send('get ' + match[1] + ' bag|c ident ' + match[1] + '|put ' + match[1] + ' bag');
    	e.stopPropagation();
	}

	match = (/^b2s (.*)/).exec(text);
	if (match) {
    	send('get ' + match[1] + ' bag|drop ' + match[1] + '|sac ' + match[1]);
    	e.stopPropagation();
	}

	match = (/^\/target (.*)/).exec(text);
	if (match) {
    	// команда обработана локально - не отправлять на сервер!
    	e.stopPropagation();
    	pchar.victim = match[1];
    	echo('\nТвоя мишень теперь ' + victim + '\n');
	}

	match = (/^\/show(?: )?(.*)?/).exec(text);
	if (match) {
    	e.stopPropagation();
    	if (match[1] === undefined) {
        	showObj(pchar);
    	} else {
        	showObj(pchar[match[1]]);
    	}
    	//match.forEach(function (t, number) {echo('!!'+number+':'+t+'!!\n')  });
	}

	match = (/^fb[\s]?([\S]*)?[\s]?([\S]*)?[\s]?([\S]*)?$/i).exec(text);
	if (match) {
    	e.stopPropagation();
    	if (test) {
        	echo('fbinput(');
        	match.forEach(function (t, number) {
            	if (number > 0) echo(number + ':' + t + ';');
        	});
        	echo(')\n');
    	}

    	var bclass;

    	if (pchar.fullbuff.target) {
        	pchar.fullbuff = new Fullbuff();
        	echo('[fullbuff canceled]\n');
    	}
    	else {
        	if (match[1] === undefined) {
            	pchar.fullbuff = new Fullbuff(undefined, 'self');
        	}
        	else {
            	bclass = getBuffClass(match[1]);
            	if (match[2] === undefined) {
                	if (bclass) {
                    	//fb protect
                    	pchar.fullbuff = new Fullbuff(bclass, 'self');
                	} else if (match[1] === 'all') {
                    	//fb all
                    	pchar.fullbuff = new Fullbuff(undefined, 'self', true);
                	} else {
                    	//fb self
                    	pchar.fullbuff = new Fullbuff(undefined, match[1]);
                	}
            	}
            	else if (match[3] === undefined) {
                	if (bclass) {
                    	//fb protect all
                    	//fb protect self
                    	if (match[2] === 'all') {
                        	pchar.fullbuff = new Fullbuff(bclass, 'self', true);
                    	} else {
                        	pchar.fullbuff = new Fullbuff(bclass, match[2]);
                    	}
                	} else if (match[1] === 'all') {
                    	//fb all self
                    	pchar.fullbuff = new Fullbuff(undefined, match[1], true);
                	}
            	} else {
                	//fb protect all self
                	pchar.fullbuff = new Fullbuff(bclass, match[3], true);
            	}
        	}
        	echo('[fullbuff start]\n');
        	checkBuff();
    	}
	}

	match = (/^ord(?:er)?[\s](.*)$/i).exec(text);
	if (match) {
    	e.stopPropagation();
    	if(match.length===2) {
        	match = match[1].toLowerCase().split(' ');
    	}
    	if (test) {
        	echo('OrderInput(');
        	match.forEach(function (t, number) {
            	//if (number > 0)
            	echo(number + ':[' + t + '];');
        	});
        	echo(')(total:'+match.length+')\n');
    	}
    	if(match[0]==='all'){// || match[match.length-1]==='all' || match[match.length-1]==='ch'
        	pchar.order = new Order(match.join(' ').replace(match[0]+' ',''));
        	if(test) echo('-->'+pchar.order.command);
        	pchar.ordersChange = true;
        	doOrder();
        	//order all stand
        	//order rat c fren
        	//order rat c fren char
        	//order rat c fren all
        	//order rat c fren 2.stone
    	} else {
        	send(text);
    	}
	}

	match = (/^g\+ (.*)/).exec(text);
	if (match) {
    	e.stopPropagation();
    	pchar.group.push({name: match[1], buffs: {}});
    	echo('\nВ группу добавлен ' + match[1] + '\n');
	}
	match = (/^g- (.*)/).exec(text);
	if (match) {
    	e.stopPropagation();

    	pchar.group.forEach(function (t, i) {
        	if (pchar.group[i].name == match[1])
            	pchar.group.splice(i, 1);
    	});
    	//pchar.group.push({name: match[1], buffs: {}});
    	echo('\nИз группы удалён ' + match[1] + '\n');
	}

	if (text.match('^test$')) {
    	e.stopPropagation();
    	echo('\'armor\' in pchar.spells:' + ('armor' in pchar.spells) + '\n');
    	echo('\'create water\' in pchar.spells:' + ('create water' in pchar.spells) + '\n');
	}
});

function go(where) {
	send(where);
}

function scan(where) {
	echo('\nscan ' + where + '\n');
	send('scan ' + where);
}

function shoot(where) {
	//send('shoot ' + where + ' ' + victim);
	send('c flame ' + where + '.' + pchar.victim);
}

//-----------------------------------------------------
// Пример хоткеев
keydown = function (e) {
//	echo('<'+e.which+'>');
	/*if (e.shiftKey) {
    	switch (e.which) {
        	case 33: // Shift+Left
            	scan('up');
            	break;
        	case 34: // Shift+Left
            	scan('down');
            	break;
        	case 37: // Shift+Left
            	scan('west');
            	break;
        	case 38: // Shift+Up
            	scan('north');
            	break;
        	case 39: // Shift+Right
            	scan('east');
            	break;
        	case 40: // Shift+Down
            	scan('south');
            	break;
        	default:
            	return;
    	}
    	e.preventDefault();
    	return;
	}*/

	if (e.ctrlKey) {
    	switch (e.which) {
        	case 33: // Ctrl+Left
            	shoot('u');
            	break;
        	case 34: // Ctrl+Left
            	shoot('d');
            	break;
        	case 37: // Ctrl+Left
            	shoot('w');
            	break;
        	case 38: // Ctrl+Up
            	shoot('n');
            	break;
        	case 39: // Ctrl+Right
            	shoot('e');
            	break;
        	case 40: // Ctrl+Down
            	shoot('s');
            	break;
        	default:
            	return;
    	}
    	e.preventDefault();
    	return;
	}

	if (e.altKey) {
    	var postGo = '';
    	switch (e.which) {
        	case 33: // Alt+Left
            	go('up' + postGo);
            	break;
        	case 34: // Alt+Left
            	go('down' + postGo);
            	break;
        	case 37: // Alt+Left
            	go('west' + postGo);
            	break;
        	case 38: // Alt+Up
            	go('north' + postGo);
            	break;
        	case 39: // Alt+Right
            	go('east' + postGo);
            	break;
        	case 40: // Alt+Down
            	go('south' + postGo);
            	break;
        	default:
            	return;
    	}
    	e.preventDefault();
    	return;
	}

	if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
    	switch (e.which) {
        	case 27: // esc
            	e.preventDefault();
            	$('#input input').val(''); // очистить поле воода
            	break;
        	case 112: // F1
            	e.preventDefault();
            	send('say hi');
            	break;
    	}
	}
};

function checking() {
	if (pchar.needsChanged)
    	pchar.needsStatus = ''
        	+ (pchar.hunger ? '[h:' + pchar.hunger + ']' : '')
        	+ (pchar.thirst ? '[t:' + pchar.thirst + ']' : '');

	if (pchar.hunger + pchar.thirst > 0)
    	echo(pchar.needsStatus);

	if (test)
    	echo('-->checking()');

	if (buffQueue.length)
    	changeBuffsStatus();

	if (pchar.affChanged)
    	checkBuff();
	if (pchar.eqChanged)
    	checkEquip();
	if (pchar.needsChanged)
    	checkNeeds();
	if(pchar.ordersChange)
    	checkOrders();
}

function checkBuff() {
	if (test) echo('\n->chkBff()');

	if (pchar.action.act === undefined)
    	pchar.affChanged = false;

	if (!pchar.buffsInit && pchar.action.act === undefined && countFields(pchar.spells)) {
    	pchar.affChanged = true;
    	doAct('affects');
    	return;
	}
	var count = 0;
	var havebuff = 0;
	var activebuff = 0;
	var cast;
	var targ = 'self';
	var lSkippSpell;
	lDebuff = false;
	pchar.affStatus = '';
	for (var key in pchar.spells) {
    	lSkippSpell = false;
    	cast = key;

    	if (test) echo('\n-->(' + key + '2' + targ + ')');
    	/*+ ':mode:' + pchar.mode
    	+ ':act:' + pchar.action.act
    	+ ':prac:' + (pchar.pract ? '1' : '0')
    	+ ',prog:' + pchar.spells[key].progress
    	+ ',class:' + pchar.spells[key].class
    	+ ',buff' + pchar.spells[key].buff
    	+ ',antog:' + (pchar.spells[key].antogonist !== undefined ? 'yes' : 'no')
    	+ ')');*/

    	if (['combat', 'creation', 'maladictions'].indexOf(pchar.spells[key].class) >= 0 //не бафф
        	|| pchar.spells[key].progress === 1) { // если еще не практился
        	if (test) echo('->(skip class:' + pchar.spells[key].class + '|' + pchar.spells[key].progress + '%)');
        	continue;
    	}

    	// сбор строки состояния аффектов
    	if (pchar.pract || (pchar.spells[key].buff && pchar.spells[key].buff < 3) || pchar.buffs[key]) {
        	pchar.affStatus += (pchar.pract && pchar.spells[key].progress === 100 && pchar.spells[key].buff != 1) ? '' :
            	((pchar.affStatus.length !== 0 ? '.' : '')
                	+ ((pchar.buffs[key] ? pchar.spells[key].brief : pchar.spells[key].brief.toLowerCase())
                    	+ (pchar.pract ? pchar.spells[key].progress + '%' : '')));
        	count++;
        	if (count == 15) {
            	count = 0;
            	pchar.affStatus = pchar.affStatus + '\n';
        	}
    	}

    	//подсчет уже скастованных спеллов при фулбаффе
    	if(pchar.fullbuff.target!==undefined && pchar.spells[key].buff!==0) {
        	if(test) echo('->calc');
        	//проверяем группу заклинания
        	if(pchar.fullbuff.class===undefined
            	|| pchar.fullbuff.class===pchar.spells[key].class) {
            	if(test) echo('(class:ok)');
            	//проверяем касуемость заклинания
            	if(pchar.fullbuff.all || pchar.spells[key].buff<3) {
                	if(test) echo('(buff:ok)');
                	if(pchar.fullbuff.target==='self' || pchar.spells[key].group>0) {
                    	if(test) echo('(++)');
                    	havebuff++;
                    	if ((pchar.fullbuff.target==='self' && pchar.buffs[key])
                        	|| (pchar.fullbuff.buffs[key] !== undefined)) {
                        	if(test) echo('(--)');
                        	activebuff++;
                    	}
                	}
            	}
        	}
    	}

    	if (pchar.action.act === undefined) {
        	if (pchar.pract && pchar.spells[key].progress === 0) {
            	pchar.affChanged = true;
            	doAct('slook', key);
        	} else if (pchar.mode === 1) {
            	// смена цели бафа
            	if(pchar.fullbuff.target) {
                	if(pchar.fullbuff.target!=='self') {
                    	targ = pchar.fullbuff.target;
                	} else if(pchar.spells[key].group>0 && pchar.fullbuff.all) {
                    	pchar.group.forEach(function (member) {
                        	if (member.buffs[key] === undefined || !member.buffs[key]) {
                            	if (test) echo('->(change target:' + member.name + ')');
                            	targ = member.name;
                        	}
                    	});
                	}
            	}

            	// если по какой-то причине не кастуем баф lSkippSpell = true
            	if ((((pchar.fullbuff.target===undefined && pchar.spells[key].buff === 1)
                    	|| pchar.fullbuff.target==='self') && pchar.buffs[key])
                	|| (pchar.fullbuff.target!==undefined && pchar.fullbuff.target !== 'self' && pchar.fullbuff.buffs[key])) {
                	// если уже висит
                	lSkippSpell = true;
                	if (test) echo('->(have one)');
            	}
            	if ((pchar.fullbuff.target!==undefined && pchar.fullbuff.target !== 'self')
                	&& (pchar.spells[key].group === 0 || pchar.spells[key].party)) {
                	//не кастуется на других или на группу
                	lSkippSpell = true;
                	if (test) echo('->(4self only|4group)');
            	}
            	if (pchar.spells[key].antogonist !== undefined) { // если есть бафы противпоположности
                	if (pchar.spells[key].buff) { //если баф
                    	// активен баф не позваляющий повесить текущий
                    	pchar.spells[key].antogonist.forEach(function (antst) {
                        	if (pchar.buffs[antst]) {
                            	if (test) echo('->(skip antogonist)');
                            	lSkippSpell = true;
                        	} else if (pchar.buffs[key] && pchar.spells[key].class==='maladictions' && pchar.spells[antst].progress > 1) {
                            	lDebuff = true;
                            	if (test) echo('->(DeBuff!!!)');
                        	}
                        	//при прокачке меняем на противоположный, если у того меньше %
                        	if (pchar.pract && pchar.spells[antst].progress < pchar.spells[key].progress && pchar.spells[antst].progress > 1) {
                            	cast = antst;
                            	if (test) echo('->(changed:' + antst + ')');
                        	}
                    	});
                	} else { // если это не баф (например лечение от слепоты)
                    	// если НЕ висит баф который нужно снять
                    	lSkippSpell = true;
                    	pchar.spells[key].antogonist.forEach(function (antst) {
                        	if (pchar.buffs[antst]) lSkippSpell = false;
                    	});
                    	if (test && lSkippSpell) echo('->(skip antidot)');
                	}
            	}

            	if (pchar.spells[key].ally !== undefined) { //если уже активен баф навешиваемый при применени текущего
                	pchar.spells[key].ally.forEach(function (ally) {
                    	if (pchar.buffs[ally]) lSkippSpell = true;
                    	if (test) echo('->(skip ally)');
                	});
            	}

            	if (!lSkippSpell) {
                	if (pchar.spells[key].buff === 0) {
                    	lSkippSpell = true;
                    	if (test) echo('->(skip 0)');
                	}
                	if (pchar.spells[key].buff === 2 && (!pchar.fullbuff.target && !pchar.pract)) {
                    	lSkippSpell = true;
                    	if (test) echo('->(skip 2)');
                	}
                	if (pchar.spells[key].buff === 3 && !pchar.pract && !pchar.fullbuff.all) {
                    	lSkippSpell = true;
                    	if (test) echo('->(skip 3)');
                	}
                	if (pchar.pract && pchar.spells[key].progress == 100 && pchar.spells[key].buff !== 1) {
                    	lSkippSpell = true;
                    	if (test) echo('->(skip 100%)');
                	}
            	}
            	//не тот класс
            	if(pchar.fullbuff.target && pchar.fullbuff.class !== pchar.spells[key].class) {
                	lSkippSpell = true;
                	if (test) echo('->(wrong class)');
            	}

            	if (lSkippSpell) {
                	if (test) echo('-->(skipped чёта)');
                	continue;
            	}
            	//echo('cast='+cast+'\n');
            	if (pchar.pose === 0) {
                	pchar.affChanged = true;
                	doAct('cast', cast, targ);
            	} else {
                	echo('надо чё-та кастануть!!!');
                	pchar.affChanged = true;
                	doAct('stand');
            	}
        	}
    	}
	}

	if (test) echo('\n(buffs:' + havebuff + ' activ:' + activebuff + ')\n');
	if (pchar.fullbuff.target && havebuff === activebuff) {
    	pchar.fullbuff = new Fullbuff();
    	echo('[fullbuff done]');
	}

} //checkBuff()

function checkNeeds() {
	if (test) echo('->checkNeeds(mode:' + pchar.mode + ' pose:' + pchar.pose + ' w:' + pchar.lwater + ' f:' + pchar.lfood + ')');
	if (pchar.action.act === undefined)
    	pchar.needsChanged = false;

	if (pchar.mode === 1) {
    	if (pchar.hunger > 1 || (pchar.pract && pchar.hunger)) {
        	if (pchar.action.act === undefined) {
            	if (pchar.pose > 0) {
                	echo('жрать хочу пора вставать!!!');
                	pchar.needsChanged = true;
                	doAct('stand');
            	} else {
                	if (!pchar.lfood) {
                    	if (pchar.food == 'manna' || pchar.food == 'mushroom') {
                        	pchar.needsChanged = true;
                        	doAct('cast', 'create food');
                    	}
                    	if (pchar.food === 'rusk') {
                        	pchar.needsChanged = true;
                        	doAct('get rusk pack');
                    	}
                	} else {
                    	pchar.needsChanged = true;
                    	doAct('eat', pchar.food);
                	}
            	}
        	}
    	}
    	if (pchar.thirst > 1 || (pchar.pract && pchar.thirst)) {
        	if (pchar.action.act === undefined) {
            	if (test) echo('->(act === undefined)');
            	if (pchar.pose > 0) {
                	echo('пить хочу пора вставать!!!');
                	pchar.needsChanged = true;
                	doAct('stand');
            	} else {
                	if (!pchar.lwater) {
                    	if (pchar.water === 'spring') {
                        	if (test) echo('->(water === spring)');
                        	pchar.needsChanged = true;
                        	doAct('cast', 'create spring');
                    	}
                    	if (pchar.water === 'flask') {
                        	if (test) echo('->(water === flask)');

                        	if (test) echo('-->(create water=' + pchar.spells['create water'] + ')');
                        	if (pchar.spells['create water'] !== undefined) {
                            	if (test) echo('->(create water !== undefined)');
                            	pchar.needsChanged = true;
                            	doAct('cast', 'create water', pchar.water);
                        	}
                    	}
                	} else {
                    	pchar.needsChanged = true;
                    	doAct('drink', pchar.water)
                	}
            	}
        	}
    	}
	}
}

function checkOrders() {
	if (test) echo('->checkOrders()\n');
	if (pchar.order.proced==pchar.group.length) {
    	pchar.ordersChange = false;
    	pchar.order = new Order();
	}

	doOrder();
}
function doOrder() {
	if (test) echo('->doOrder()\n');
    	if(pchar.order.command!== undefined) {
        	pchar.group.forEach(function (t, number) {
            	if(number<pchar.order.proced) return;
            	if(test)echo('  - '+t.name+' ('+number+'/'+pchar.order.proced+') act:'+pchar.action.act+'\n');
            	if(pchar.action.act === undefined) {
                	pchar.order.proced++;
                	doAct('order',pchar.order.command,t.name);
            	}
        	});
    	}
}

function checkEquip() {
	if (pchar.armed === 0 && pchar.action.act !== '\\get') {
    	doAct('\\get', pchar.weapon);
	}
	if (pchar.armed === 1 && pchar.action.act !== '\\wield') {
    	doAct('\\wield', pchar.weapon);
	}
}

function changeBuffsStatus() {
	if (test) echo('-->changeBuffsStatus()');
	var buff;
	while (buffQueue.length) {
    	buff = buffQueue.pop();
    	if (test) echo('->(' + buff.sBuff + ':' + buff.lStatus + ')');
    	buffChange(buff.sBuff, buff.lStatus, buff.lActionDone, buff.action);
	}
}

function buffChange(sBuff, lStatus, lActionDone, action) {
	if (test) echo('-->buffChange()');

	var forGroup = false;
	var forGroupMember = false;
	var forSelf = false;
	var forTarg = false;

	var lGroupAlly = false;
	if (sBuff in pchar.spells) { //бывают аффекты которых нет в спелах
    	if (test) echo('->(есть такой ' + sBuff + ')');
    	if (pchar.spells[sBuff].ally !== undefined) {
        	if (test) echo('->(есть ally)');
        	pchar.spells[sBuff].ally.forEach(function (spell) {
            	if (spell === action.command && pchar.spells[spell].group)
                	if (test) echo('->(ally4group ' + spell + ')');
            	lGroupAlly = true;
        	});
    	}
    	if (pchar.spells[sBuff].group || lGroupAlly) {
        	if (test) echo('->(ally4group&me)');
        	forGroup = true;
        	forSelf = true;
    	}
    	if (action.command === sBuff && action.target !== 'self') {
        	if (test) echo('->(not4me?' + pchar.fullbuff.target + ')');
        	if (action.target === pchar.fullbuff.target) {
            	if (test) echo('->(not4me4' + pchar.fullbuff.target + ')');
            	forTarg = true;
        	} else {
            	if (test) echo('->(4group?)');
            	pchar.group.forEach(function (member) {
                	if (member.name == action.target) {
                    	if (test) echo('->(4' + member.name + ')');
                    	forGroupMember = true;
                	}
            	});
        	}

    	}
    	if (action.target === 'self' || (!forGroup && !forTarg && !forGroupMember)) {
        	if (test) echo('->(4self)');
        	forSelf = true;
    	}
    	if (!lStatus && pchar.spells[sBuff].party) {
        	if (test) echo('->(remove from group)');
        	forGroup = true;
    	}

    	if (sBuff !== action.command && pchar.spells[sBuff].antogonist !== undefined) {
        	spells[sBuff].antogonist.forEach(function (spell) {
            	if (spell === action.command) {
                	sBuff = action.command;
            	}
        	});
    	}
	}
	//Результаты:
	if (test) echo('->(result_finale: 4Self:' + forSelf + ' 4Group:' + forGroup + ' 4Targ:' + forTarg + ' 4GroupMember:' + forGroupMember + ')');
	if (forSelf) {
    	//вешаем на себя
    	if (test) echo('->(' + sBuff + ' self ' + lStatus + ')');
    	pchar.buffs[sBuff] = lStatus;
	}
	if (forGroup) {
    	//вешаем на группу
    	pchar.group.forEach(function (member) {
        	if (test) echo('->(' + sBuff + ' ' + member.name + ' ' + lStatus + ')');
        	member.buffs[sBuff] = lStatus;
    	});
	}
	if (forTarg) {
    	if (test) echo('->(' + sBuff + ' ' + action.target + ' ' + lStatus + ')');
    	pchar.fullbuff.buffs[sBuff] = lStatus;
	}
	if (forGroupMember) {
    	//вешаем на кого скастовано
    	pchar.group.forEach(function (member) {
        	if (member.name == action.target) {
            	if (test) echo('->(' + sBuff + ' ' + action.target + ' ' + lStatus + ')');
            	member.buffs[sBuff] = lStatus;
        	}
    	});
	}

	if (sBuff === action.command && lActionDone)
    	clearAction();
}


function charInit(chname) {
	if (test)
    	echo('-->charInit()');

	if (charnames[chname] !== undefined)
    	pchar = new Pchar(chars[charnames[chname]]);
}


function doAct(act, comm, tag) {
	if (test) echo('doAct(' + act + ', ' + comm + ', ' + tag + ')');
	pchar.action = new Action(act, comm, tag);

	var result = '';

	if (act)
    	result += act;

	if (act === 'cast' && comm !== undefined) {
    	result += ' \'' + comm + '\'';
	} else if (act !== comm && comm !== undefined) {
    	result += ' ' + (act==='order'?tag:comm);
	}

	if (tag /*&& tag !== 'self'*/) {
    	result += ' ' + (act==='order'?comm:tag);
	}

	if (result !== '') {
    	send(result);
    	echo('-->[' + result + ']\n');
	} else
    	echo('\ndoAct(' + act + ',' + comm + ',' + tag + '): ERROR\n');
}

function clearAction() {
	for (var key in pchar.action) {
    	pchar.action[key] = undefined;
	}
}

function clearBuffs() {
	if (test) echo('->clearBuffs()');
	for (var key in pchar.spells) {
    	pchar.buffs[key] = undefined;
	}
}


function Action(act, command, target) {
	this.act = act; //spelling, wearing, drinking, eating, getting, slooking
	this.command = command;
	this.target = target;
}

function showObj(obj, spacer) {
	var spaces = (spacer === undefined ? '' : spacer);
	for (var key in obj) {
    	echo(spaces + key + ':');
    	if (typeof obj[key] === 'object') {
        	echo('{\n');
        	showObj(obj[key], spaces + '  ');
        	echo('}');
    	} else
        	echo(obj[key] + ';');
    	echo('\n');
	}
}

//Конструкторы
function Pchar(char) {
	if (test) echo('-->Pchar() (name:' + char.name + ';weapon:' + char.weapon + ')');

	this.init = true;
	this.buffsInit = false;

	this.name = char.name;
	this.weapon = char.weapon;

	this.armed = false; // 0 - без оружия(оружие на земле), 1 - оружие в мешке, 2 - вооружен
	this.pose = 0; //0-stand, 1-rest/sit, 2-sleep
	this.mode = false; //1-peace, 2-war

	this.action = {
    	act: undefined,
    	command: undefined,
    	target: undefined
	};
	this.food = char.food;
	this.water = char.water;
	this.thirst = 0;
	this.hunger = 0;
	this.lfood = false;
	this.lwater = false;

	this.affChanged = true;
	this.eqChanged = false;
	this.needsChanged = false;
	this.ordersChange = false;

	this.pract = false; //указатель на принудительную прокачку скилов, спелов.

	this.spells = new Spells(char);

	this.group = [];
	this.buffs = {};

	this.fullbuff = new Fullbuff();
	this.order = new Order();
}

function Fullbuff(bclass, btarget, all) {
	echo('->Fullbuf('+bclass+','+btarget+','+all+')');
	this.class = bclass === undefined ? undefined : bclass;
	this.target = btarget === undefined ? undefined : btarget;
	this.all = all === undefined ? false : all;
	this.buffs = {};
}

function Order(comm) {
	this.command = comm===undefined ? undefined : comm;
	this.proced = comm===undefined ? undefined : 0;
}

function Spells(char) {
	if (char.class === 'necromancer') {
    	this['learning'] = new Spell('LRN', 33, 'protective', 1);
    	this['magic missile'] = new Spell('mm', 2, 'combat');
    	this['chill touch'] = new Spell('ChT', 7, 'combat');
    	this['create water'] = new Spell('CrW', 11, 'creation');
    	this['create food'] = new Spell('CrF', 12, 'creation');
    	this['armor'] = new Spell('ARM', 13, 'protective', 2, 3);
    	this['detect good'] = new Spell('DtG', 13, 'detection', 3);
    	this['detect undead'] = new Spell('DtU', 13, 'detection', 3);
    	this['detect invis'] = new Spell('DtI', 13, 'detection', 1);
    	this['burning hands'] = new Spell('BnH', 14, 'combat');
    	this['protection negative'] = new Spell('PrN', 13, 'protective', 2);
    	this['protection good'] = new Spell('PrG', 17, 'protective', 2);
    	this['protective shield'] = new Spell('PrS', 18, 'protective', 2);
    	this['shield'] = new Spell('SHD', 18, 'protective', 2, 3);
    	this['poison'] = new Spell('PSN', 23, 'maladictions');
    	this['lightning bolt'] = new Spell('LiB', 23, 'combat');
    	this['fly'] = new Spell('FLY', 23, 'protective',1);
    	this['dispel affects'] = new Spell('DAf', 24, 'maladictions');
    	this['cancellation'] = new Spell('CNL', 28, 'maladictions');
    	this['giant strength'] = new Spell('GSt', 28, 'protective', 2, 2);
    	this['sonic resonance'] = new Spell('SoR', 28, 'combat');
    	this['stone skin'] = new Spell('StS', 30, 'protective', 2);
    	this['dark shroud'] = new Spell('DSh', 21, 'protective', 2, 2);
    	this['magic concentrate'] = new Spell('MCt', 60, 'protective', 2);
    	this['create spring'] = new Spell('CrS', 31, 'creation');
	}
	if(char.clan === 'invader') {
    	this['shadow cloak'] = new Spell('ShC', 10, 'protective', 2);
	}
};

function Spell(brief, level, sclass, buff, group, party, aAntogonist, aAlly) {
	//buff: 0 - никогда, 1 - всегда, 2 - fullbuff, 3 - только при прокачке
	//group (кастовать на членов группы): 0-no, 1-yes, 2-full, 3-target
	//party (кастуется на всю группу)
	this.brief = brief;
	this.level = level;
	this.class = sclass;
	this.buff = buff===undefined ? 0 : buff;
	this.group = group===undefined ? 0 : group;
	this.party = party===undefined ? false : party;
	this.antogonist = aAntogonist;
	this.ally = aAlly;
	this.progress = 0;
}

function BuffQueue(sBuff, lStatus, lActionDone, action) {
	this.sBuff = sBuff;
	this.lStatus = lStatus;
	this.lActionDone = lActionDone;
	this.action = action;
}

var buffPatterns = [
	// pattern, status, active
	['ruler aura', '^Аура Рулера исчезает.$', false, false],
	['ruler aura', '^Теперь ты чувствуешь себя более информированным, правя Миром.$', true, true],
	['ruler aura', '^Ты и так уже знаешь многое в этом мире, неподвластное другим.$', true, true],
	['learning', '^Желание учиться покидает тебя.$', false, false],
	['learning', '^Ты концентрируешься на учебе.$', true, true],
	['learning', '^.* будет учиться лучше!$', true, true],
	['learning', '^Куда уж больше.$', true, true],
	['learning', '^.* уже учится.$', true, true],
	['learning', '^Ему это не поможет.$', true, true],
	['aid', '^Ты можешь помочь еще кому-нибудь.$', false, false],
	['aid', '^Волна тепла согревает твое тело.$', true, true],
	['aid', '^Это заклинание использовалось совсем недавно.$', true, true],
	['armor', '^Окружавшая тебя броня исчезает.$', false, false],
	['armor', '^Священная броня окружает .*.$', true, true],
	['armor', '^Волшебная броня окружает .*.$', true, true],
	['armor', '^.* уже защищен(а)? заклинанием брони.$', true, true],
	['shield', '^Щит, окружавший тебя, исчезает.$', false, false],
	['shield', '^Божественная энергия окружает .* щитом.$', true, true],
	['shield', '^Волшебный щит окружает .*.$', true, true],
	['shield', '^.* уже защищен(а)? заклинанием щита.$', true, true],
	['enhanced armor', '^Силовое поле, защищавшее тебя, исчезает.$', false, false],
	['enhanced armor', '^Силовая защита окружает .*.$', true, true],
	['enhanced armor', '^Силовое поле уже защищает тебя.$', true, true],
	['enhanced armor', '^Силовое поле уже окружает .*.$', true, true],
	['bless', '^Ты больше не чувствуешь божественного благословления.$', false, false],
	['bless', '^Ты больше не чувствуешь божественного благословения.$', false, false],
	['bless', '^Ты чувствуешь божественное благословение.$', true, true],
	['bless', '^.* уже благословлен.', true, true],
	['bless', '^Ты даришь .* благословение своих богов.', true, true],
	['sanctuary', '^Белая аура вокруг тебя исчезает.$', false, false],
	['sanctuary', '^Белая аура окружает .*.$', true, true],
	['sanctuary', '^.* уже под защитой святилища.', true, true],
	['sanctuary', '^.* уже под защитой темных богов.', true, true],
	['observation', '^Ты больше не видишь состояния других.$', false, false],
	['observation', '^Теперь ты замечаешь состояние других.$', true, true],
	['observation', '^Ты уже замечаешь состояние других.$', true, true],
	['fly', '^Ты медленно опускаешься на землю.$', false, false],
	['fly', '^Твои ноги отрываются от земли.$', true, true],
	['fly', '^.*? поднимается в воздух\.$', true, true],
	['fly', '^.* уже находи.*ся в воздухе\.$', true, true],
	['fly', '^.* уже находи.*ся в воздухе\.$', true, true],
	['fly', '^.* может подняться в воздух и без твоей помощи\.$', true, true],
	['stardust', '^Звездная пыль вокруг тебя рассеивается.$', false, false],
	['stardust', '^Мерцающая звездная пыль закружилась вокруг .*\.$', true, true],
	['stardust', '^Звездная пыль уже кружится вокруг .*\.$', true, true],
	['stardust', '.* уже под защитой святилища.$', true, true],
//	['stardust', '^.* уже под защитой святилища\.$', true, true],
	['stardust', '^.* может подняться в воздух и без твоей помощи\.$', true, true],
	['frenzy', '^Твой гнев проходит.$', false, false],
	['frenzy', '^Дикая ярость наполняет тебя!$', true, true],
	['frenzy', '^В глазах .* вспыхивает дикая ярость!$', true, true],
	['frenzy', '^Твои боги не благосклонны к ', true, true],
	['frenzy', '^Сейчас ничто не может разозлить ', true, true],
	['frenzy', '^.* уже в ярости!$', true, true],
	['stone skin', '^Твоя кожа становится мягче.$', false, false],
	['stone skin', '^Твоя кожа становится тверже камня.$', true, true],
	['stone skin', '^Твоя кожа уже тверда как камень.$', true, true],
	['dragon skin', '^Твоя кожа становится мягче.$', false, false],
	['dragon skin', '^Твоя кожа уже тверда, как драконья.$', true, true],
	['dragon skin', '^Твоя кожа становится тверже драконьей.$', true, true],
	['protective shield', '^Охранный щит вокруг тебя исчезает.$', false, false],
	['protective shield', '^Охранный щит окружает тебя.$', true, true],
	['protective shield', '^Охранный щит уже окружает тебя.$', true, true],
	['protective shield', '^Предохранительный щит окружает тебя.$', true, true],
	['giant strength', '^Ты становишься слабее.$', false, false],
	['giant strength', '^Слабость проходит... но лишь на мгновение.$', false, true],
	['giant strength', '^Ты чувствуешь, как силы возвращаются к тебе.$', false, true],
	['giant strength', ' станови[тшь]{1,2}ся намного сильнее.$', true, true],
	['giant strength', '^.* не може[тшь]{1,2} быть еще сильнее.$', true, true],
	['protection heat', '^Твоя защищенность от воздействия высоких температур понижается.$', false, false],
	['protection heat', '^Твоя защищенность от воздействия высоких температур повышается.$', true, true],
	['protection heat', '^Ты уже защищен от огня.$', true, true],
	['protection cold', '^Твоя защищенность от воздействия низких температур понижается.$', false, false],
	['protection cold', '^Твоя защищенность от воздействия низких температур повышается.$', true, true],
	['protection cold', '^Ты уже защищен от холода.$', true, true],
	['inspire', '^Твое воодушевление проходит.$', false, false],
	['inspire', '^Ты чувствуешь воодушевление!$', true, true],
	['inspire', '^Ты уже воодушевлен.$', true, true],
	['detect invis', '^Ты более не чувствуешь присутствие невидимых сил.$', false, false],
	['detect invis', '^Теперь ты чувствуешь присутствие невидимых сил.$', true, true],
	['detect invis', '^Ты уже чувствуешь присутствие невидимых сил.$', true, true],
	['improved detect', '^Ты теперь не замечаешь очень невидимые силы.$', false, false],
	['improved detect', '^Теперь ты чувствуешь присутствие очень невидимых сил.$', true, true],
	['improved detect', '^Ты уже чувствуешь присутствие очень невидимых сил.$', true, true],
	['invisibility', '^Ты появляешься из ниоткуда.$', false, false],
	['invisibility', '^Теперь окружающие видят тебя.$', false, false],
	['invisibility', '^Ты становишься невидимым.$', true, true],
	['invisibility', '^Тебя уже и так не видно.$', true, true],
	['improved invis', '^Ты становишься видимым для окружающих.$', false, false],
	['improved invis', '^Ты становишься совсем невидимым.$', true, true],
	['detect good', '^Ты больше не видишь Золотой ауры.$', false, false],
	['detect good', '^Теперь ты чувствуешь присутствие добра.$', true, true],
	['detect good', '^Ты уже чувствуешь присутствие добрых сил.$', true, true],
	['detect evil', '^Ты больше не видишь Красной ауры.$', false, false],
	['detect evil', '^Теперь ты чувствуешь зло.$', true, true],
	['detect evil', '^Ты уже чувствуешь присутствие дьявольских сил.$', true, true],
	['protection good', '^Ты беззащитен перед добром.$', false, false],
	['protection good', '^Ты чувствуешь защиту темных сил.$', true, true],
//	['protection good', '^Ты уже защищен.$', true, true],
	['protection evil', '^Ты чувствуешь себя беззащитнее перед злом.$', false, false],
	['protection evil', '^Ты чувствуешь защиту светлых сил.$', true, true],
//	['protection evil', '^Ты уже защищен.$', true, true],
	['haste', '^Твои движения становятся намного быстрее.$', true, true],
	['haste', '^Ты не можешь двигаться быстрее, чем сейчас!$', true, true],
	['haste', ' не может двигаться еще быстрее.$', true, true],
	['mental block', '^Теперь ты будешь блокировать все попытки ментального контакта с тобой.$', true, true],
	['mental block', '^Ты теряешь способность блокировать ментальный контакт.$', false, false],
	['identify', '^кинжал чаморро, откликается на имена \'чаморрийский кинжал chamorro dagger\'$', true, true],
	['transform', '^Здоровье, приданное тебе магией, исчезает прочь.$', false, false],
	['transform', '^Прилив жизненной силы затмевает твой разум.$', true, true],
	['transform', '^Ты уже переполнен жизненной энергией.$', true, true],
	['magic concentrate', '^Ты чувствуешь, как сверхмощная способность к разрушению заполняет все твое тело.', true, true],
	['magic concentrate', '^Ты уже достаточно сконцентрирован.', true, true],
	['magic concentrate', '^Ты теряешь невидимую нить, связывающую тебя с источником магической силы.', false, false],
	['spell resistance', '^Теперь заклинания причиняют тебе меньший вред.', true, true],
	['spell resistance', '^Ты уже имеешь эту защиту.', true, true],
	['spell resistance', '^Заклинания вновь имеют полную силу против тебя.', false, false],
	['blindness', '^Тебя ослепили!$', true, true],
	['blindness', '^Не получилось.$', false, true],
	['blindness', '^Ты вновь обретаешь зрение.$', false, true],
	['blindness', '^Твое зрение в порядке.$', false, false],
	['blindness', '^Твое зрение в порядке.$', false, true],
	['faerie fire', '^Тебя окружает Розовая аура.$', true, true],
	['faerie fire', '^Розовая аура вокруг тебя исчезает.$', false, false],
	['dark shroud', '^Темная аура вокруг тебя исчезает.$', false, false],
	['dark shroud', '^Белая аура вокруг тебя исчезает.$', false, false],
	['dark shroud', '^Темная аура окружает .*.$', true, true],
	['dark shroud', '^.* уже под защитой святилища.', true, true],
	['dark shroud', '^.* уже под защитой темных богов.', true, true],
	['protection negative', '^Ты беззащитен перед своими атаками.$', false, false],
	['protection negative', '^Ты приобретаешь иммунитет к негативным атакам.$', true, true],
	['protection negative', '^У тебя уже есть иммунитет к негативным атакам.', true, true],
	['shadow cloak', '^Призрачная мантия, окутывавшая тебя, тает.$', false, false],
	['shadow cloak', '^Жажда чужих душ стихает внутри тебя.$', false, false],
	['shadow cloak', '^Призрачная мантия окутывает тебя.$', true, true],
	['shadow cloak', '^В тебе загорается огонь, жаждущий душ ангелов.$', true, true],
	['shadow cloak', '^Призрачная мантия уже защищает тебя.$', true, true],
	['shadow cloak', '^Жажда душ уже горит в тебе.$', true, true],

	['detect undead', '^Ты перестаешь чувствовать мертвецов.$', false, false],
	['detect undead', '^Теперь ты чувствуешь нежить.$', true, true],
	['detect undead', '^Ты уже чувствуешь нежить.', true, true],
];

function countFields(obj) {
	result = 0;
	for (var key in obj) {
    	result++;
	}
	return result;
}

function getBuffClass(text) {
	// detection  protective
	if (text.match('^def.*|^pro.*')) {
    	return 'protective';
	}
	if (text.match('^det')) {
    	return 'detection';
	}
	return false;
}
