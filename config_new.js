/*TODO
- вынести список говорунов в переменную/массив [#говоруны]
- вынести #prompt и #battleprompt в chars, на случай если у чаров разный prompt

- Тебя останавливают несколько добродушных старушек.
- Группа закованных в латы людей с суровыми лицами преграждает тебе путь.
------------------------
*/

/* Этот файл будет сохранен в браузере (в LocalStorage.settings).
 * В переменной mudprompt хранится много полезной информации о персонаже.
 * Подробнее см. https://github.com/dreamland-mud/mudjs/wiki/MUD-prompt
 * Расшифровка аффектов: https://github.com/dreamland-mud/mudjs/blob/dreamland/src/prompt.js
 */

//возвращаем серый фон
$('.terminal').css("background-color", "#2e3436");
$('.terminal-wrap').css("background-color", "#2e3436");
$('body').css("background-color", "#353535");
$('input').css("background-color", "#2e3436");

var test = false; //true - для вывода всякой отладочной информации
var melt_counter = 0; //противодействие автовыкидыванию

//номер панели заклинаний
var numpad_set = 0;
var panel_set = 0;
var str, con, dex, wis, int, cha;
var str_max, con_max, dex_max, wis_max, int_max, cha_max;
var counter=0, bonus=0;
var chars = {
    'Miyamoto': {
        name: 'Miyamoto',
        align: 'e',
        weapon: 'mace',//'hickey', //'арапник',
        class: 'cleric',
        clan: 'ruler',
        water: 'spring',//'flask',
        food: 'manna',
        buffs_needs: {
            //(всегда, при фулбафе, всегда на члена группы, при фулбафе на члена группы)
            'ruler aura': new Buff_need(true, true, false, false),
            'group defense': new Buff_need(false, false, false, true),
            'inspire': new Buff_need(false, true, false, true),
            'shadow cloak': new Buff_need(false, true, false, false),
            'dark shroud': new Buff_need(false, true, false, true),
            'shield': new Buff_need(false, true, false, true),
            'protective shield': new Buff_need(false, true, false, true), 
            'armor': new Buff_need(false, true, false, true),
            'stone skin': new Buff_need(false, true, false, true),
            'protection good': new Buff_need(false, true, false, false),
            'spell resistance': new Buff_need(false, true, false, true),
            'mental block': new Buff_need(true, true, false, false),
            'magic concentrate': new Buff_need(false, true, false, false),
            'protection negative': new Buff_need(false, true, false, false),
            'protection cold': new Buff_need(false, true, false, false),
            'giant strength': new Buff_need(false, false, false, true),
            'detect invis': new Buff_need(false, true, false, false),
            'improved detect': new Buff_need(false, false, false, false),
            'infravision': new Buff_need(false, false, false, false),
            'detect magic': new Buff_need(true, false, false, false),
        
            //pets:
            'stardust': new Buff_need(false, true, false, true),
            'sanctuary': new Buff_need(true, true, false, true),
            'enhanced armor': new Buff_need(false, true, false, true),
            'haste': new Buff_need(false, false, false, true),
            'bless': new Buff_need(false, true, false, true),
            'dragon skin': new Buff_need(false, true, false, true),
            'frenzy': new Buff_need(false, false, false, true),
        }
    },
    'Zaleshanin': {
        name: 'Zaleshanin',
        align: 'n',
        weapon: 'long',
        class: 'thief',
        water: 'flask',
        food: 'rusk',
    }
};

var match;

var my_char = new Pchar();

var attack_spell_wait = undefined;

var buffQueue = [];

/*--------------------------------------------------------------------------
 * Триггера - автоматические действия как реакция на какую-то строку в мире.
 *-------------------------------------------------------------------------*/
$('.trigger').on('text', function (e, text) {
    //качаем haggle
    if(text.match("Ты покупаешь свечу за ")){
        send('sell candle');
    }
    if(text.match("Ты продаешь свечу за ")){
        send('buy candle');
    }
    //качаем wand
    if(text.match("Ты учишься на своих ошибках, и твое умение 'wands' совершенствуется.")
    ||text.match("Теперь ты гораздо лучше владеешь искусством 'wands'!")){
        echo('-->[slook]');
        send('slook wand');
    }
    if(text.match("Твоя арфа разваливается на куски.")){
        echo('-->[new harp]');
        send('get harp bag|wear harp|use harp');
    }
    if(text.match("Ты взмахиваешь арфой на себя.")){
        echo('-->[run se|use harp]');
        send('run se|use harp');
    }
    //Ты учишься на своих ошибках, и твое умение 'wands' совершенствуется.
    //Теперь ты гораздо лучше владеешь искусством 'wands'!

    match = (/^ *сила *([0-9]{1,2}) \(из ([0-9]{1,2})\) *сложение *([0-9]{1,2}) \(из ([0-9]{1,2})\) *ловкость *([0-9]{1,2}) \(из ([0-9]{1,2})\)$/).exec(text);
    if(match) {
        str = Number(match[1]);
        str_max = Number(match[2]); 
        con = Number(match[3]);
        con_max = Number(match[4]); 
        dex = Number(match[5]);
        dex_max = Number(match[6]); 
        return;
    }
    match = (/^ *мудрость *([0-9]{1,2}) \(из ([0-9]{1,2})\) *интеллект *([0-9]{1,2}) \(из ([0-9]{1,2})\) *обаяние *([0-9]{1,2}) \(из ([0-9]{1,2})\)$/).exec(text);
    if(match) {
        wis = Number(match[1]);
        wis_max = Number(match[2]); 
        int = Number(match[3]);
        int_max = Number(match[4]); 
        cha = Number(match[5]);
        cha_max = Number(match[6]);
        bonus = (wis+int+dex) - (wis_max+dex_max+int_max-3);
        if(str>=15 && cha >= 18 && (wis+int+dex) >= (wis_max+dex_max+int_max-3)) {
            echo("YES: "+(wis+dex+int)+" >= "+(wis_max+dex_max+int_max-3));
        }else{
            counter++;
            if(counter>20) {send("sca s");counter=0;}
            echo("NO: "+(wis+dex+int)+" >= "+(wis_max+dex_max+int_max-3) + "("+str+"str)" + "("+cha+"cha)");
            send("гов лекарь нет");
        }
        return;
    }

    //[#prompt] + [#battleprompt] example: <1111/1111 2222/2222 333/333 [time][exits]>[0W0D]
    //промпт тестера  <3084/3084зд 4800/4800ман 756/756шг 3939оп Вых:СВЮЗ>
    //                <3084/3084зд 4309/4800ман 756/756шг 3939оп Вых:СВЮЗ> [100%:90%]
    match = (/^(<([0-9]{1,5})\/([0-9]{1,5}) ([0-9]{1,5})\/([0-9]{1,5}) ([0-9]{1,5})\/([0-9]{1,5}) \[(.*)]\[.*]>\[.*](\([0-9]{1,3}%:[0-9]{1,3}%\))?)|(<([0-9]{1,5})\/([0-9]{1,5})зд ([0-9]{1,5})\/([0-9]{1,5})ман ([0-9]{1,5})\/([0-9]{1,5})шг ([0-9]{1,5})оп Вых:.*>( \[[0-9]{1,3}%:[0-9]{1,3}%\])?)$/).exec(text);
    if (match) {
        promptRecived(false);
    }
    match = (/^<(AFK|АФК)>[\s]?$/).exec(text);
    if (match) {
        promptRecived(true);
    }
    if (!my_char.init) return;

    match = (/^Режим AFK в(ы)?ключен.$/).exec(text);
    if (match) {
        if (test) echo("[AFK trigger]");
        if (my_char.action.act === 'afk') {
            clearAction();
        }
    }
    if (text.match('^Ты прячешься в тенях.$')) {
        if (test) echo("[Fade trigger]");
        my_char.was_fade = undefined;
        if (my_char.action.act === 'fade') {
            clearAction();
        }
    }

    if (text.match('^Ты растворяешься в воздухе.$')) {
        if (++melt_counter % 10 === 0)
            send('who');
        else
            send('where');
        echo('[melt:' + melt_counter + ']');

    }

    if (text.match('^В твоей голове звучат торжественные слова на тайном наречии Азазеля:$')) {
        if(test) echo("[wait for Azazel words]");
        lAzazel = true;
        return;
    }
    
    if(lAzazel) {
        match = (/^[\s]*([\w\s]*), ([\w\s]*), ([\w\s]*)$/).exec(text);
        if(match) {
            if(test) echo('[new Azazel words]');
            azazel = new Azazel(match[1],match[2],match[3]);
            setTimeout(() => azazel=new Azazel(), 35*60*1000);
        } else {
            if(test) echo('[no any Azazel words]');
        }
        lAzazel = false;
    }

    buffPatterns.forEach(function (elem) {
        if (buffs_list[elem[0]] !== undefined) {
            if (text.match(elem[1])) {
                if(test) echo("[buffPattert trigger]:"+elem[0]);
                
                my_char.affChanged = true;
                buffQueue.push(new BuffQueue(elem[0], elem[2], elem[3], new Action(my_char.action.act, my_char.action.command, my_char.action.target)));
                if (my_char.action.command !== undefined
                    && my_char.action.command === 'cancellation')
                    clearAction();
            }
        }
    });

    //[#weapon]
    if (text.match(' у тебя оружие, и оно упало на землю!$')) {
        my_char.eqChanged = true;
        my_char.armed = 0;
        if (test) echo('(armed=0)\n');
    }
    if (text.match(' ВЫБИЛ.? у тебя оружие!$')) {
        my_char.eqChanged = true;
        my_char.armed = 1;
        if (test) echo('(armed=1)\n');
    }
    if (my_char.action.act === '\\get' && my_char.action.command === my_char.weapon && text.match('^Ты берешь .*\.$')) {
        clearAction();
        if (my_char.armed === 0) {
            my_char.armed = 1;
            my_char.eqChanged = true;
        }
        if (test) echo('(armed=1)\n');
    }
    if (text.match('^Ты вооружаешься .*\.$')) {
        if (my_char.action.act === '\\wield' && my_char.action.command === my_char.weapon) clearAction();
        my_char.armed = 2;
        if (test) echo('(armed=2)\n');
    }

    if (text.match('^Ты не можешь сконцентрироваться.$')
        || text.match('^Увы, никого с таким именем в этой местности обнаружить не удается.$')
        || text.match('^Ты пытаешься сотворить заклинание, но теряешь концентрацию и терпишь неудачу.$')
        || text.match('^Твоя попытка закончилась неудачей.$')
        || text.match('На кого именно ты хочешь произнести заклинание') 
        || text.match('Это заклинание нельзя использовать во время сражения.') ) {
        
        if(test) echo('[spell fail trigger]')
        clearAction();
        if (my_char.fullbuff.target && text.match('На кого именно ты хочешь произнести заклинание')) {
        	my_char.fullbuff = new Fullbuff();
        	echo('[target not found -> fullbuff canceled]\n');
    	}
    }
    if (text.match('^Ты просыпаешься и встаешь.$')
    || text.match('^Ты уже стоишь.$') || text.match('^Ты встаешь.$') || text.match('^Ты уже сражаешься!$')) {
        clearAction();
        if (my_char.fullbuff.target && text.match('На кого именно ты хочешь произнести заклинание')) {
        	my_char.fullbuff = new Fullbuff();
        	echo('[target not found -> fullbuff canceled]\n');
    	}
    }
    //[#ruler badge]
    //Ты надеваешь символ Хранителя Закона!
    //Но у тебя уже что-то надето на шею.
    if (text.match('^Серебряный символ Хранителя Закона превращается в пыль.$')) {
        //if(test)
        echo("--> ruler badge expire triger <--");
        my_char.ruler_badge = false;
        my_char.needsChanged = true;
    }
    if (text.match('^Ты надеваешь символ Хранителя Закона!$') 
        || text.match('^Но у тебя уже что-то надето на шею.$')) {
        //if(test)
        echo("--> ruler badge wear triger <--");
        my_char.ruler_badge = true;
        my_char.needsChanged = true;
        if (my_char.action.command !== undefined 
            && my_char.action.command === 'ruler badge') {
            clearAction();
        }

    }

    //[#food][#drink]
    if (text.match('^Ты ешь .*\.$') || text.match('^У тебя нет этого.$') || text.match('^Это несъедобно.$')) {
        if (my_char.action.act !== undefined) {
            if (my_char.action.act === 'eat') {
                clearAction();
            }
            my_char.lfood = false;
        }
    }
    if (text.match('^Ты больше не чувствуешь голода.$')) {
        my_char.hunger = 0;
        my_char.needsChanged = true;
    }
    if (text.match('^Ты хочешь есть.$')) {
        my_char.hunger++;
        my_char.needsChanged = true;
    }
    if (text.match('^Ты умираешь от голода!$')) {
        my_char.hunger = 10;
        my_char.needsChanged = true;
    }
    if (text.match('^Ты взмахиваешь руками, и с неба падает манна небесная.$')
        || text.match('^Волею Дворкина тебе в руки падает манна небесная на пропитание.$')
        || text.match('^Ты берешь соленый сухарик из пакета сухарей.$')
        || text.match('^Ты прищуриваешься и выращиваешь у себя на ладони магический гриб.$')//Ты взмахиваешь руками и создаешь магический гриб.
    ) {
        my_char.lfood = 1;
        my_char.needsChanged = true;
        if (my_char.action.command === 'create food'
            || (my_char.action.act == 'get' && my_char.action.command === my_char.food))
            clearAction();
    }

    if (text.match(' родник высыхает.$')) {
        my_char.lwater = false;
    }
    if (text.match('^Ты не находишь это.$') || text.match('^Здесь пусто.$')) {
        if (my_char.action.act !== undefined)
            if (my_char.action.act === 'drink') {
                clearAction();
            }
        my_char.lwater = false;
    }
    if (text.match('^Ты хочешь пить.$')) {
        my_char.thirst++;
        my_char.needsChanged = true;
        // echo('[буль-буль:' + my_char.thirst + ']\n');
    }
    if (text.match('^Ты умираешь от жажды!$')) {
        my_char.thirst = 10;
        my_char.needsChanged = true;
        // echo('[буль-буль:' + my_char.thirst + ']\n');
    }
    if (text.match('^Ты щелкаешь пальцами, и из земли пробивается магический родник.$') //text.match(' родник пробивается сквозь землю.$')        
        || text.match('^Милостью .* из земли пробивается священный родник.$')
        || text.match('^Жестяная фляга наполнена.$')
        || text.match('^Милостью .* ты наполняешь жестяную флягу святой водой.$')
        || text.match('^В жестяной фляге уже что-то плещется.$')
        || text.match('^Ты хочешь сделать тут озеро?')
        || text.match('^В этой местности и так есть чем напиться.')) {
        if (test) echo("[water creation trigger]");
        my_char.lwater = 1;
        if (my_char.action.command == 'create spring' || my_char.action.command == 'create water')
            clearAction();
    }
    if (text.match('^Ты пьешь [^\s]* из ')) {
        if (my_char.action.act == 'drink')
            clearAction();
    }
    if (text.match('^Ты больше не чувствуешь жажды.$')) {
        my_char.thirst = 0;
        my_char.lwater = false;
        my_char.needsChanged = true;
    }

    //[#else]
    if (text.match('^(Ok|Твой последователь должен быть рядом с тобой)\.$')) {
        var not_here = '';
        if(text.match('Твой последователь должен быть рядом с тобой')){
            not_here = '[not here]';
            my_char.fullbuff.away.push(my_char.group.members[my_char.action.target].name);
        }
        if(test) echo('-->"Ok.'+not_here+'" match!!!<--\n');
        if (my_char.action.act !== undefined) {
            if (my_char.action.act==='order') {
                clearAction();
            }
        }
    }
    if (text.match('^.* произносит \'Хозяин, у меня мана кончилась!\'\.$')) {
        if(test) echo('-->empty mana trigger!!!<--\n');
        if (my_char.action.act !== undefined) {
            if(my_char.fullbuff.target!=null) {
                my_char.fullbuff.empty.push(my_char.group.members[my_char.action.target].name);
            }
            if (my_char.action.act==='order') {
                clearAction();
            }
        }
    }


    if (text.match('Обессилев, ты падаешь лицом вниз!')) {
        //        echo('>>> ЕЩЕ РАЗОК!!!\n');
        //        send('встать|выбить ' + doorToBash);
    }

    // к стандартным уведомлениям добавлен хрустальный шар и поздравлялки. Убраны уведомления от некоторых мобов. [#говоруны]
    if (!text.match('^Валькирия |^Русалка |^The Ofcol cityguard |^Стражник |^Водяной |^The weaponsmith |^Архивариус |^Мальчик |^Булочник |^Колдун |^Ювелир |^Хассан |^Охранник султана |^Продавец доспехов |^Оружейник |^Бакалейщик ')
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
    }

});

/*----------------------------------------------------------------------------
 * Алиасы - свои команды с аргументами. Так же см. help alias про алиасы в игре.
 *----------------------------------------------------------------------------*/
// Здесь хранится текущая жертва для выстрелов из лука или удаленных заклинаний.
var victim;

// Здесь хранится, какую дверь пытаемся вышибить.
var doorToBash = 'n';

// Здесь хранится оружия для триггера на выбивание из рук.
var weapon = 'dagger';

// Вспомогательная функция для выполнения команды с аргументами.
function command(e, cmd, text, handler) {
    var match, re;

    // Попытаться распознать команду в формате 'cmd' или 'cmd аргумент'
    re = new RegExp('^' + cmd + ' *(.*)');
    match = re.exec(text);
    if (!match)
        return false;

    // Нашли соответствие. Аргументы передаем в параметры функции-обработчика команды.
    handler(match);
    e.stopPropagation(); // команда обработана локально - не отправлять на сервер
}

// Примеры алиасов.
$('.trigger').on('input', function (e, text) {
    //цифра - номер заклинания для установки в my_char.attack_spells.set
    if(attack_spell_wait!=undefined){
        match = (/^([0-9]{1,2}) ?/).exec(text);
        if(match) {
            let new_spell = my_char.attack_spells.list[attack_spell_wait.group][match[0]];
            if(new_spell!=undefined) {
                my_char.attack_spells.set[numpad_set][attack_spell_wait.group][attack_spell_wait.key]= new_spell;

                echo(my_char.attack_spells.get_prompt());
 
                if(test) console.log('new attack spell ['+attack_spell_wait.group+']['+attack_spell_wait.key+']->'+new_spell);
            }
            attack_spell_wait=undefined;
            e.stopPropagation();
        }
    }
    //приказать всем
    command(e, 'ord(?:er)?', text, function (args) {
        args = args[1].toLowerCase().split(' ');

        if (test) {
            args.forEach(function (t, number) {
                //if (number > 0)
                echo(number + ':[' + t + '];\n');
            });
            echo('(total:' + args.length + ')\n');
        }
        if (args[0] === 'clear') {
            my_char.order = new Order();
            my_char.ordersChange = true;
        } else if (args[0] === 'all') {
            echo('>>> Начинаем всем приказывать \n');
            my_char.order = new Order(args.join(' ').replace(args[0] + ' ', ''));
            if (test) echo('-->' + my_char.order.command);
            my_char.ordersChange = true;
            doOrder();
        } else {
            send(text);
        }
    });

    //обкаст fullbuff
    command(e, 'fb', text, function (args) {
        if(test)
            echo('test fullbuff start --> ok. args['+args+"]("+args.length+")");

        var bclass;
        var match;

        if (my_char.fullbuff.target) {
        	my_char.fullbuff = new Fullbuff();
        	echo('[fullbuff canceled]\n');
    	}
    	else {
            match = (/^fb[\s]?([\S]*)?[\s]?([\S]*)?[\s]?([\S]*)?$/i).exec(args[0]);
            if (match[1] === undefined || match[1] === "") {
            	my_char.fullbuff = new Fullbuff(undefined, 'self');
        	}
        	else {
            	bclass = getBuffClass(match[1]);
            	if (match[2] === undefined) {
                	if (bclass) {
                    	//fb protect
                    	my_char.fullbuff = new Fullbuff(bclass, 'self');
                	} else if (match[1] === 'all') {
                    	//fb all
                    	my_char.fullbuff = new Fullbuff(undefined, 'self', true);
                	} else {
                    	//fb self
                    	my_char.fullbuff = new Fullbuff(undefined, match[1]);
                	}
            	}
            	else if (match[3] === undefined) {
                	if (bclass) {
                    	//fb protect all
                    	//fb protect self
                    	if (match[2] === 'all') {
                        	my_char.fullbuff = new Fullbuff(bclass, 'self', true);
                    	} else {
                        	my_char.fullbuff = new Fullbuff(bclass, match[2]);
                    	}
                	} else if (match[1] === 'all') {
                    	//fb all self
                    	my_char.fullbuff = new Fullbuff(undefined, match[1], true);
                	}
            	} else {
                	//fb protect all self
                	my_char.fullbuff = new Fullbuff(bclass, match[3], true);
            	}
        	}
        	echo('[fullbuff start]\n');
        	checkBuffv2();
        }
    });
/*Чтобы воззвать к Азазелю, произнеси его имя и добавь тайные слова -- 
например, сказать azazel sefer yetsirah. Используй их вовремя и с умом,
ибо безжалостный Азазель не прощает ошибок.*/
    command(e, 'ah', text, function (args) {
        azazel.heal.use();
    });
    command(e, 'ac', text, function (args) {
        azazel.curse.use();
    });
    command(e, 'aa', text, function (args) {
        azazel.attack.use();
    });
    //ввод азазелевых слов вручную
    command(e,'azazel',text,function(args){
        match = (/^[\s]?([\w\s]*), ([\w\s]*), ([\w\s]*)$/).exec(args[1]);
        if(match) {
            if(test) echo('[new Azazel words]');
            azazel = new Azazel(match[1],match[2],match[3]);
            setTimeout(() => azazel=new Azazel(), AZAZEL_TIMER*60*1000);
        } else {
            if(test) echo('[no any Azazel words]');
        }
    });

    // Установить жертву для выстрелов, например: /victim hassan
    command(e, '/victim', text, function (args) {
        victim = args[1];
        echo('>>> Твоя мишень теперь ' + victim + "\n");
    });

    // Установить оружие (см. тригер выше), например: /weapon меч
    command(e, '/weapon', text, function (args) {
        weapon = args[1];
        echo('>>> Твое оружие теперь ' + weapon + "\n");
    });

    // Опознать вещь из сумки, например: /iden кольцо
    command(e, '/iden', text, function (args) {
        send('взять ' + args[1] + ' сумка');
        send('к опознание ' + args[1]);
        send('полож ' + args[1] + ' сумка');
    });

    // Выбросить и уничтожить вещь из сумки: /purge барахло
    command(e, '/purge', text, function (args) {
        send('взять ' + args[1] + ' сумка');
        send('бросить ' + args[1]);
        send('жертвовать ' + args[1]);
    });

    // Начать выбивать двери (см. тригер выше): /bd юг
    command(e, '/bd', text, function (args) {
        doorToBash = args[1];
        echo('>>> Поехали, вышибаем по направлению ' + doorToBash + '\n');
        send('выбить ' + doorToBash);
    });

});


/*------------------------------------------------------------------------------
 * Горячие клавиши - по умолчанию умеет ходить/стрелять/всматриваться через кейпад. 
 *------------------------------------------------------------------------------*/

// Вспомогательные функции для горячих клавиш.
function go(where) {
    send(where);
}

function scan(where) {
    echo('-->[scan ' + where+']')
    send('scan ' + where);
}

// Рейнджеры могут стрелять по жертве victim из лука, а маги и клеры - 
// бить заклинаниями в соседнюю комнату.
function shoot(where,key) {
    let spell = my_char.attack_spells.get_spell('range',key);
    echo("-->[cast '"+spell+"' "+where+"."+victim+"]");
    send("cast '"+spell+"' "+where+"."+victim);
}
function cast(group,key) {
    let spell = my_char.attack_spells.get_spell(group,key);
    echo("-->[cast '"+spell+"' "+victim+"]");
    send("cast '"+spell+"' "+victim);
}

// Коды клавиш на кейпаде.
var KP_0 = 96,
    KP_1 = 97,
    KP_2 = 98,
    KP_3 = 99,
    KP_4 = 100,
    KP_5 = 101,
    KP_6 = 102,
    KP_7 = 103,
    KP_8 = 104,
    KP_9 = 105,
    KP_MUL = 106,
    KP_PLUS = 107,
    KP_MINUS = 109,
    KP_DOT = 110,
    KP_DIV = 111,
    N_1 = 49,
    N_2 = 50,
    N_3 = 51,
    N_4 = 52,
    N_5 = 53,
    N_6 = 54,
    N_7 = 55,
    N_8 = 56,
    N_9 = 57,
    N_0 = 58,
    N_DASH = 189,
    N_EQUAL = 187;

// Просто клавиша - идти по направлению, ctrl+клавиша - стрелять, alt+клавиша - всмотреться.
function dir(d, e) {
    if(test) console.log("dir("+d+")"
        +(e.ctrlKey?" ctrl":"")
        +(e.altKey?" alt":"")
        +(e.shiftKey?" shift":""));
    /* if (e.ctrlKey && e.shiftKey) {
        shoot(d,1);
    } else  */
    if (e.ctrlKey && e.altKey) {
        shoot(d,1);
    } else if (e.ctrlKey) {
        shoot(d,0);
    } else if (e.altKey) {
        scan(d);
    } else {
        go(d);
    }
}

function setSpell(g,key,e) {
    if(test) console.log("setSpell("+d+")"
        +(e.ctrlKey?" ctrl":"")
        +(e.altKey?" alt":"")
        +(e.shiftKey?" shift":""));
    if(e.ctrlKey) {
        if(e.shiftKey) {
            attack_spell_wait = {
                'group':g,
                'key':key
            };
            my_char.attack_spells.showSpells(g,key);
            return true;
        } else if (e.altKey) {
            my_char.attack_spells.changeSpell(g,key);
            return true;
        } else {
            //TODO shoot spell by Ctrl+1-0 key
            return false;
        }
    } 
    
    return false;
}

function castSpell(group, e) {
    if (e.shiftKey) {
        cast(group,2);
    } else if (e.ctrlKey) {
        cast(group,1);
    } else {
        cast(group,0);
    }
}

// Назначаем горячие клавиши и их действия.
keydown = function (e) {
    switch (e.which) {
        case KP_3:
            dir('down', e);
            break;
        case KP_2:
            dir('south', e);
            break;
        case KP_4:
            dir('west', e);
            break;
        case KP_5:
            send('scan');
            break;
        case KP_6:
            dir('east', e);
            break;
        case KP_8:
            dir('north', e);
            break;
        case KP_9:
            dir('up', e);
            break;
        case KP_PLUS:
            castSpell("close", e);
            break;            
        case KP_MINUS:
            castSpell("curse", e);
            break;
        case KP_DOT:
            castSpell("room", e);
            break;

        case 27: // escape
            if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
                $('#input input').val(''); // очистить поле воода
            } else {
                return;
            }
            break;


        /*
                case KP_0:
                    break;
                case KP_2:
                    break;        
                case KP_7:
                    break;
                case KP_MUL:
                    break;
                
                case KP_DIV:
                    break;
                case 112: // F1
                    break;
                case 113: // F2
                    break;
                case 114: // F3
                    break;
                case 115: // F4
                    break;
                case 116: // F5
                    break;
                    
               // Для кодов остальных клавиш смотри https://keycode.info 
        */
        case N_1:
            if (setSpell('range','0',e))
                break;
            else
                return;
        case N_2:
            if (setSpell('range','1',e))
                break;
            else
                return;
        case N_3:
            if (setSpell('close','0',e))
                break;
            else
                return;
        case N_4:
            if (setSpell('close','1',e))
                break;
            else
                return;
        case N_5:
            if (setSpell('close','2',e))
                break;
            else
                return;
        case N_6:
            if (setSpell('curse','0',e))
                break;
            else
                return;
        case N_7:
            if (setSpell('curse','1',e))
                break;
            else
                return;                        
        case N_8:
            if (setSpell('curse','2',e))
                break;
            else
                return; 
        case N_9:
            if (setSpell('room','0',e))
                break;
            else 
                return;
        case N_0:
            if (setSpell('room','1',e))
                break;
            else
                return;
        case N_DASH:
            if (setSpell('room','2',e))
                break;
            else
                return;
        case N_EQUAL:
            /* if (setSpell('room','2',e))
                break;
            else */
                return;
        default:
            return; // по умолчанию просто посылаем клавишу на сервер
    }

    e.preventDefault(); // не посылать клавишу на сервер если обработана выше
};

function charInit() {
    if (test) echo(' -->charInit()');

    let char_obj = getChar();

    if (test) echo(' -->charname=' + char_obj.sees);

    if (chars[char_obj.sees] !== undefined){
        my_char = new Pchar(char_obj.sees, chars[char_obj.sees], char_obj.level);
    } else {
        if (test) echo(' -->chars[' + char_obj.sees + '] == undefined');
    }
}

function getChar() {
    let result = '';
    if (isEqualChar(mudprompt.group.leader))
        return mudprompt.group.leader;

    for (var i in mudprompt.group.pc) {
        if (isEqualChar(mudprompt.group.pc[i])) {
            return mudprompt.group.pc[i];
        };
    }
    return result;
}

function isEqualChar(ch) {
    if (ch.hit == mudprompt.hit && ch.max_hit == mudprompt.max_hit)
        return true;

    return false;
}
function checkOrders() {
	if (test) echo('->checkOrders()\n');
	if (my_char.order.proced==mudprompt.group.npc.length) {
        echo("->doOrder()[finished]");
    	my_char.ordersChange = false;
    	my_char.order = new Order();
	} else {
        doOrder();
    }

}
function doOrder() {
    var vict_name;
    if(my_char.action.act != undefined) {
        return;
    }
    if (test) echo('->doOrder('+(my_char.order.proced+1)+'/'+mudprompt.group.npc.length+')');

    if(my_char.order.command!== undefined && mudprompt.group.npc[my_char.order.proced]!=undefined) {
        vict_name = mudprompt.group.npc[my_char.order.proced].sees;
        if(test) echo('-->proceed:' + my_char.order.proced + ' mudprompt.group.npc['+my_char.order.proced+']:' + vict_name);

        if(my_char.order.name_num[vict_name]==undefined) {
            my_char.order.name_num[vict_name] = 1;
        } else {
            my_char.order.name_num[vict_name]++;
        }
        vict_name = '' + my_char.order.name_num[vict_name] + '.' + vict_name;
        vict_name="'"+vict_name+"'";
        if(test) echo("-->changed:"+vict_name);

        if(my_char.action.act === undefined) {
            my_char.order.proced++;
            doAct('order',my_char.order.command,vict_name);
        }
    } 
}
function doAct(act, comm, tag) {
    if (test) echo('-->doAct(action:' + act + ', command:' + comm + ', target:' + tag + ')');
    my_char.action = new Action(act, comm, tag);

    var result = '';

    if (act)
        result += act;

    if (act === 'cast' && comm !== undefined) {
        result += ' \'' + comm + '\'';
    } else if (act !== comm && comm !== undefined) {
        result += ' ' + (act === 'order' ? tag : comm);
    }

    if (tag /*&& tag !== 'self'*/) {
        result += ' ' + (act === 'order' ? comm : tag);
    }

    if (result !== '') {
        echo('-->[' + result + ']\n');
        send(result);
    } else
        echo('\ndoAct(' + act + ',' + comm + ',' + tag + '): ERROR\n');
}
function clearAction() {
    if (test) echo(' -->clearAction()\n');
    for (var key in my_char.action) {
        my_char.action[key] = undefined;
    }
}
//[#prompt]
function promptRecived(afk) {
    if (test) echo('prompt(ok)');

    if (!my_char.init || my_char.name != getChar().sees) {
        charInit();
        if (test) echo('\n');
    }
    if (my_char.was_fade !== undefined &&  (mudprompt['trv']!==undefined && mudprompt['trv']!=='none' && mudprompt['trv'].a.indexOf('F')!==-1)) {
        my_char.was_fade = undefined;
    }

    my_char.afk = afk;

    if (my_char.was_afk !== undefined && my_char.afk && my_char.action.act!="afk") {
        my_char.was_afk = undefined;
    }

    if (my_char.last_pose !== undefined) {
        if (my_char.last_pose == mudprompt.p2.pos) {
            my_char.last_pose = undefined;
        }
        if (my_char.action.act == mudprompt.p2.pos)
            clearAction();
    }

    checking();

}

//[#checks] [#проверялки]
function checking() {
    if (test) echo(' -->checking()');
    if (test) echo(' --> status:'
        + (my_char.afk ? '[afk]' : '')
        + ((mudprompt['trv']!==undefined && mudprompt['trv']!=='none' && mudprompt['trv'].a.indexOf('F')!==-1) ? '[fade]' : '')
        + (my_char.last_pose != undefined ? '[last:' + my_char.last_pose + ']' : '')
        + (my_char.was_afk != undefined ? '[was_afk]' : '')
        + (my_char.was_fade != undefined ? '[was_fade]' : '')
        + (my_char.action.act != undefined ? '[act:' + my_char.action.act + ']' : '')
        + ' pos:' + mudprompt.p2.pos
        + (mudprompt.p2.posf != '' ? '; posf:' + mudprompt.p2.posf : '')
        + '\n');
    let azazelStr = '';
    azazelStr = azazel.stat();
    //if(test) azazelStr = 'AZAZEL:['+azazelStr+']';

    if(my_char.init) echo(my_char.attack_spells.get_prompt());
    
    let needsStatus = '';
    if (my_char.needsChanged)
        needsStatus = ''
            + (my_char.hunger ? '[h:' + my_char.hunger + ']' : '')
            + (my_char.thirst ? '[t:' + my_char.thirst + ']' : '');

    let group_length = 0;
    if(mudprompt.group.pc!==undefined)
        group_length += mudprompt.group.pc.length;

    if(mudprompt.group.npc!=undefined)
        group_length += mudprompt.group.npc.length;

    if (Object.keys(my_char.group.members).length != group_length) 
        checkGroup();

    if(azazelStr!='')
        echo(azazelStr);

    if (my_char.hunger + my_char.thirst > 0)
        echo(needsStatus);

    if (my_char.eqChanged)
        checkEquip();

    if (buffQueue.length)
    	changeBuffsStatus();
    if (my_char.affChanged)
    	checkBuffv2();

    if(my_char.action.act != undefined) echo('[act:' + my_char.action.act + ' command:'+my_char.action.command+' target:'+my_char.action.target+']');

    if (my_char.needsChanged)
        checkNeeds();

    if(my_char.ordersChange)
    	checkOrders();

    if (!my_char.needsChanged && !my_char.eqChanged
    && (my_char.last_pose != undefined || my_char.was_afk != undefined))
        restoreStatus();
    
}
function checkGroup() {
    if(test) echo("->checkGroup()");
    my_char.group = new Group();
    if(mudprompt.group.pc!==undefined)
        setGroupMembersFrom(mudprompt.group.pc);

    if(mudprompt.group.npc!==undefined)
        setGroupMembersFrom(mudprompt.group.npc);

    if(test) {echo("-->members:"+Object.keys(my_char.group.members).length+" pet_spells:"+my_char.group.spells.length);}
}

function setGroupMembersFrom(list) {
    if(test) echo("-->setGroupMembersFrom("+list.length+")");

    for(let member in list) {
        let name = pets[list[member].sees]
            ? pets[list[member].sees].ename
            : list[member].sees;
        let level = list[member].level;
        let i = 1;
        let new_name = i+"."+name;
        while(my_char.group.members[new_name]!=undefined) {
            new_name = ++i + "." + name;
        }
    
        my_char.group.members[new_name] = new GroupMember(name, new_name);
        //пишем спелы доступные чармису в my_char.group.spells
        //выборка кастуемых спелов в checkBuff()
        if(pets[list[member].sees]!=undefined && pets[list[member].sees].spells.length>0){
            for(let pet_spell of pets[list[member].sees].spells){
                if(buffs_list[pet_spell]===undefined) 
                    continue;

                my_char.group.spells.push([name,pet_spell,level]);
            }
        }
    }

    if(test) {
        console.log("setGroupMembersFrom()");
        console.log(my_char.group.members);
    }
}
function checkBuffv2() {
	if (test) {
        echo('\n->chkBffv2()');
        console.log("chckBuffv2 started");
        console.log("my_char.fullbuff:");
        console.log(my_char.fullbuff);
    }
    
    //чар чем-то занят - прерываем
    if (my_char.action.act === undefined && ["stand", "sit", "rest", "sleep"].indexOf(mudprompt.p2.pos)!=-1) {
        my_char.affChanged = false;
    } else {
        return;
    }

    var fb = my_char.fullbuff.target === undefined ? false : true;
    var fb_all = my_char.fullbuff.all === undefined ? false : my_char.fullbuff.all;
    var fb_class = my_char.fullbuff.class;
    var fb_target = my_char.fullbuff.target;
    var targets = [];
    
    if(fb_target===undefined || fb_target==='self') {
        targets.push(my_char.name);
    } else if(fb_all) {
        for(let member_name in my_char.group.members) {
            targets.push(member_name);
        }
        targets.push(my_char.name);
    } else {
        targets.push(fb_target);
    }

    /*  
    собирается список всех спелов 
    в случае прокачки спелов - только спелы чара
    в остальных случаях спелы чаров могут быть заменены спелами чармиса с уровнем выше уровня чара 
    */
    var oSpells = {}; 
    //мои бафы
    for(let spell of my_char.spells) {
        //х.з. что с этим спелом дальше делать!
        if(my_char.buffs_needs[spell]==undefined) {
            continue;
        }

        if((my_char.buffs_needs[spell].always
            || my_char.buffs_needs[spell].gm_always
            || my_char.buffs_needs[spell].fullbuff
            || my_char.buffs_needs[spell].gm_fullbuff)==false) {
                continue;
            }
    

        //вообще не баффы - пропускем
        if (['combat', 'creation', 'maladiction'].indexOf(buffs_list[spell].class) >= 0) {
            continue;
        }
        //не тот класс заклинания - пропускаем
        if(fb_class!==undefined && fb_class !== buffs_list[spell].class) {
            continue;
        }
        oSpells[spell]=new MemberSpell(my_char.name, my_char.level);
    }
    //бафы чармисов
    for(let aSpell of my_char.group.spells) {
        //х.з. что с этим спелом дальше делать!
        if(my_char.buffs_needs[aSpell[1]]==undefined) continue;
        if((my_char.buffs_needs[aSpell[1]].always
            || my_char.buffs_needs[aSpell[1]].gm_always
            || my_char.buffs_needs[aSpell[1]].fullbuff
            || my_char.buffs_needs[aSpell[1]].gm_fullbuff)==false) continue;
        //вообще не бафф - пропусем
        if (['combat', 'creation', 'maladiction'].indexOf(buffs_list[aSpell[1]].class) >= 0) continue;
        //не тот класс заклинания - пропускаем
        if(fb_class!==undefined && fb_class !== buffs_list[aSpell[1]].class) continue;

        //во время прокачки, с чармисов оставляем только обязательные (buff==1) 
        if(my_char.pract && my_char.buffs_needs[aSpell[1]].always==false && my_char.buffs_needs[aSpell[1]].gm_always==false) continue; 

        //пропускаем если при фулбафе не кастуется
        if(my_char.buffs_needs[aSpell[1]].always==false
            && my_char.buffs_needs[aSpell[1]].gm_always==false
            && my_char.buffs_needs[aSpell[1]].fullbuff==false
            && my_char.buffs_needs[aSpell[1]].gm_fullbuff==false) continue;
        
        if(oSpells[aSpell[1]]!=undefined) {
            //пропускаем если уже зареган спел большего уровня
            if(oSpells[aSpell[1]].level>=aSpell[2]) continue;

            //пропускаем если уже зареган, и бафается только на себя
            if(buffs_list[aSpell[1]].target==false) continue;
        }            
        //кастер заблудился
        if(my_char.fullbuff.away.indexOf(aSpell[0])!=-1) continue;
        //у кастера закончилась мана
        if(my_char.fullbuff.empty.indexOf(aSpell[0])!=-1) continue;

        oSpells[aSpell[1]]=new MemberSpell(aSpell[0], aSpell[2]);
    }
    if(test) {
        console.log('chkBuffv2::oSpells:');console.log(oSpells);
        console.log('chkBuffv2::targets:');console.log(targets);
    }
    let spell_to_cast, victim, caster, victim_align, group_member;
    for(let spell_name in oSpells) {
        caster = oSpells[spell_name].member;
        spell_to_cast = spell_name;
        victim = undefined; victim_align = undefined;

        if(test) echo("---->["+caster+"]["+spell_name+"]"+'[key:'+buffs_list[spell_name].mgroup+"-"+buffs_list[spell_name].mbrief+']');
    
        //не фулбаф, не обязательный - пропускаем
        if(!fb) {
            group_member=true;
            if(my_char.buffs_needs[spell_name].always==false) {
                if(test) echo('------>not fullbuff not required spell skipped!');
                continue;
            }
        }
        for(let target_name of targets) {
            if(test) echo('------>check "'+spell_name+'" for '+target_name);
            //если на чаре уже числится бафф - пропускаем чара
            if(my_char.fullbuff.hasBuff(target_name, spell_name)) {
                if(test) echo("------>skipped (char have one)");
                continue;
            }
            if(target_name==my_char.name) {
                group_member=true;
                victim_align = my_char.align;
                //на меня не кастуется - пропускаем
                if(!fb) {
                    //не фулбаф, не обязательный - пропускаем
                    if(my_char.buffs_needs[spell_name].always==false) {
                        if(test) echo('------>spell skipped: not fullbuff not required!');
                        continue;
                    }
                } else {
                    //фулбаф, не вешается - пропускаем
                    if(my_char.buffs_needs[spell_name].fullbuff==false) {
                        if(test) echo('------>spell skipped: not required while fullbuff!');
                        continue;
                    }
                }
                //на цель не вешается, пытаемся сменить на своё
                if(!buffs_list[spell_name].target && !buffs_list[spell_name].party && caster!=my_char.name) {
                    for(let my_spell of my_char.spells) {
                        if((my_spell[0]==spell_name || buffs_list[spell_name].ally.indexOf(my_spell[0])!=-1) 
                            && my_spell[1]<=my_char.level){
                            spell_to_cast = my_spell[0];
                            caster = my_char.name;
                            break;
                        }
                    }
                    if(caster!=my_char.name) {
                        if(test) echo('------>only for self ('+caster+') spell skipped for me!');
                        continue;
                    }
                }
            } else if(my_char.group.members[target_name]!=undefined){
                let pet_name;
                if(pets[my_char.group.members[target_name].name]!=undefined) {
                    pet_name = my_char.group.members[target_name].name;
                }
                victim_align = my_char.group.members[target_name].align;
                //на чармиса не кастуется - пропускаем
                if(!fb) {
                    //не фулбаф, не обязательный - пропускаем
                    if(my_char.buffs_needs[spell_name].gm_always==false) {
                        if(test) echo('------>spell skipped: not fullbuff not required for charmed!');
                        continue;
                    }
                } else {
                    //фулбаф, не вешается - пропускаем
                    if(my_char.buffs_needs[spell_name].gm_fullbuff==false) {
                        if(test) echo('------>spell skipped: not required for charmed while fullbuff!');
                        continue;
                    }
                }
                //на цель не вешается, пытаемся сменить на своё
                if(!buffs_list[spell_name].target && caster!=my_char.group.members[target_name].name) {
                    if(pet_name==undefined) {
                        if(test) echo('------>only for self ('+caster+') spell skipped for uncknown pet '+target_name+'!');
                        continue;
                    }
                    
                    if(pets[pet_name].spells.indexOf(spell_name)!=-1) {
                        if(test) echo('------>caster '+caster+' changed to '+pet_name+' for self use spell!');
                        caster = pet_name;
                    }
                    if(caster!=pet_name) {
                        for(let pet_spell of pets[pet_name].spells) {
                            if(buffs_list[spell_name].ally.indexOf(pet_spell)) {
                                echo('------>caster '+caster+' changed to '+pet_name+', spell "'+spell_name+'" changed to "'+pet_spell+'"!');
                                caster = pet_name;
                                spell_to_cast = pet_sepll;
                                break;
                            }
                        }
                    }

                    if(caster!=pet_name) {
                        if(test) echo('------>only for self ('+caster+') spell skipped for pet '+pet_name+'!');
                        continue;
                    }
                }

            } else {
                group_member=false;
                //баф на кого-то еще...
                //пропускаем бафы на группу
                if(buffs_list[spell_name].party==true) {
                    if(test) echo('------>party spell skipped for not group member: '+target_name+'!');
                    continue;
                }
                //на цель не вешается
                if(!buffs_list[spell_name].target) {
                    if(test) echo('------>only for self ('+caster+') spell skipped for: '+target_name+'!');
                    continue;
                }
            }
            victim = target_name;
        }
        if(victim==undefined){
            if(test) echo('------>chars dont need buff - skipped');
            continue;
        } 

        if(victim_align!=undefined) {
            //не подходит по алигну:
            if(buffs_list[spell_name].aligns.indexOf(victim_align)==-1) {
                //ищем аналоги:
                if(buffs_list[spell_name].ally!=undefined) {
                    for(let ally of buffs_list[spell_name].ally) {
                        if(buffs_list[ally].aligns.indexOf(victim_align)==-1){
                            continue;
                        }
                        if(oSpells[ally]!=undefined) {
                            spell_to_cast = ally;
                            caster = oSpells[ally].member;
                        }                       
                    }
                }
                if(spell_to_cast==spell_name) {
                    if(test) echo("------>skipped for "+target_name+"(align:"+buffs_list[spell_name].align+":"+victim_align+")");
                    continue;
                }
                if(test) echo("------>spell changed: "+spell_to_cast);
            }
        }

        //если член группы или я - нет ли группового спела с этим баффом.
        if(group_member && buffs_list[spell_name].grSpell!=undefined 
            && oSpells[buffs_list[spell_name].grSpell]!=undefined){
            spell_to_cast = buffs_list[spell_name].grSpell;
            caster = oSpells[spell_to_cast].member;
            victim = caster;

            if(test) echo('------>spell changet to group spell:"'+spell_to_cast+'", caster:'+caster);
        }       
        
        if(test) echo("---->spell:'"+spell_to_cast+"' caster:"+caster+" target:"+victim);

        if (my_char.afk) {
            changeAFK();
            my_char.affChanged = true;
            return;
        }    
        if(mudprompt['trv']!==undefined && mudprompt['trv']!=='none' && mudprompt['trv'].a.indexOf('F')!==-1) {
            my_char.was_fade = true;
        }
        if(caster==my_char.name) {
            if (mudprompt.p2.pos === "stand") {
                my_char.affChanged = true;
                doAct('cast', spell_to_cast, victim==my_char.name?'self':victim);
                return;
            } else {
                echo('надо чё-та кастануть!!!');
                my_char.affChanged = true;
                doAct('stand');
                return;
            }
        } else {
            my_char.affChanged = true;
            doAct('order', "cast '"+spell_to_cast+"'"+(caster==victim?'':" "+victim), caster);
            return;
        } 
    }

    if(my_char.fullbuff.target) {
        echo('[fullbuff done]');
        my_char.fullbuff = new Fullbuff();
    }
};

function changeBuffsStatus() {
	if (test) echo('-->changeBuffsStatus()');
	var buff; var action;
	while (buffQueue.length) {
    	buff = buffQueue.pop();
        action = new Action(buff.action.act,buff.action.command,buff.action.target);
    	if (test) echo('---->(buff status change: ' + buff.sBuff + ':' + buff.lStatus + ' {a:'+action.act+',c:'+action.command+',t:'+action.target+'})');

        if(action.act == 'order') {
            let match = (/^(cast) '(.*)'(?: (.*))?$/).exec(action.command);
            if(match) {
                action = new Action(match[1],match[2],match[3]?match[3]:action.target);
            } else {
            }
        }       
    	buffChange(buff.sBuff, buff.lStatus, buff.lActionDone, action);
	}
}
function buffChange(sBuff, lStatus, lActionDone, action) {
	if (test) echo('-->buffChange('+sBuff+','+lStatus+','+lActionDone +',{a:'+action.act+',c:'+action.command+',t:'+action.target+'})');

	var forGroup = false;
	var forGroupMember = false;
	var forSelf = false;
	var forTarg = false;

	var lGroupAlly = false;
	if (sBuff in buffs_list) {
    	if (test) echo('---->("' + sBuff + '" имеется в buffs_list)');

        if(buffs_list[sBuff].grSpell != undefined) {
            if (test) echo('---->(есть grSpell)');
            if (buffs_list[sBuff].grSpell === action.command){
                if (test) echo('---->(group spell: ' + action.command + ')');
                lGroupAlly = true;
                sBuff = action.command;
            }
        }

    	if (buffs_list[sBuff].ally !== undefined) {
        	if (test) echo('---->(есть ally)');
        	buffs_list[sBuff].ally.forEach(function (spell) {
            	if (spell === action.command && buffs_list[spell].target)
                	if (test) echo('---->(ally4group ' + spell + ')');
            	lGroupAlly = true;
        	});
    	}
    	if (buffs_list[sBuff].target || lGroupAlly) {
        	if (test) echo('---->(ally4group&me)');
        	forGroup = true;
        	forSelf = true;
    	}
    	if (action.command === sBuff && action.target !== 'self') {
        	if (test) echo('---->(not4me?' + my_char.fullbuff.target + ')');
        	if (action.target === my_char.fullbuff.target) {
            	if (test) echo('---->(not4me4: fb.target:' + my_char.fullbuff.target + ', act.target:'+action.target+')');
                forGroup = false;
                forSelf = false;
            	forTarg = true;
        	} else {
            	if (test) echo('---->(4group?)');
                for(let member_name in my_char.group.members) {
                    if (member_name == action.target) {
                        if (test) echo('---->(4"' + member_name + '")');
                        forGroupMember = true;
                    }
                }
        	}

    	}
    	if (action.target === 'self' || (!forGroup && !forTarg && !forGroupMember)) {
        	if (test) echo('---->(4self)'+"(+target_self:"+(action.target === 'self')+")");
        	forSelf = true;
    	}
    	if (!lStatus && buffs_list[sBuff].party) {
        	if (test) echo('---->(remove from group)');
        	forGroup = true;
    	}

    	if (sBuff !== action.command && buffs_list[sBuff].antogonist !== undefined) {
        	buffs_list[sBuff].antogonist.forEach(function (spell) {
            	if (spell === action.command) {
                	sBuff = action.command;
            	}
        	});
    	}
	}
	//Результаты:
	if (test) echo('---->(result_finale: 4Self:' + forSelf + ' 4Group:' + forGroup + ' 4Targ:' + forTarg + ' 4GroupMember:' + forGroupMember + ')');
	if (forSelf) {
    	//вешаем на себя
    	
        if(lStatus && !my_char.hasBuff(sBuff)) {
            if (test) echo('---->(forSelf:' + sBuff + ': ' + lStatus + ')->add to buffs[missing in mudprompt] ');

            my_char.buffs.set(sBuff);
        } else if (!lStatus && my_char.hasBuff(sBuff)) {
            if (test) echo('---->(forSelf:' + sBuff + ': ' + lStatus + ')->removing from buffs');
            my_char.buffs.remove(sBuff);
        }
    	//my_char.hasBuff(sBuff) = lStatus;
	}
	if (forGroup) {
    	//вешаем на группу
        for(let member_name in my_char.group.members) {
            if (test) echo('---->(forGroup:' + sBuff + ' ' + member_name + ' ' + lStatus + ')');
        	my_char.group.members[member_name].buffs[sBuff] = lStatus;
        }
	}
	if (forTarg) {
    	if (test) echo('---->(forTarg:' + sBuff + ' ' + action.target + ' ' + lStatus + ')');
    	my_char.fullbuff.buffs[sBuff] = lStatus;
	}
	if (forGroupMember) {
    	//вешаем на кого скастовано
        if (test) echo('---->(forGroupMember:' + sBuff + ' ' + action.target + ' ' + lStatus + ')');
        my_char.group.members[action.target].buffs[sBuff] = lStatus;
	}

	if (sBuff === action.command && lActionDone)
    	clearAction();

}

function checkEquip() {
    if (test) echo(' -->checkEquip()');
    my_char.eqChanged = false;

    if (my_char.armed === 0 && my_char.action.act !== '\\get') {
        doAct('\\get', my_char.weapon);
    }
    if (my_char.armed === 1 && my_char.action.act !== '\\wield') {
        doAct('\\wield', my_char.weapon);
    }
}

function checkNeeds() {
    if (test) echo('->checkNeeds(hunger:' + my_char.hunger + ' f:' + my_char.lfood
        + ' thirst:' + my_char.thirst + ' w:' + my_char.lwater + ')');
    if (my_char.hunger + my_char.thirst == 0 && my_char.ruler_badge) {
        my_char.needsChanged = false;
        return;
    }
    if (my_char.action.act !== undefined) {
        return;
    }

    if ((my_char.hunger + my_char.thirst > 0) 
        && (my_char.hunger <= 1 && my_char.thirst <= 1)
        && !(my_char.pract && (my_char.hunger || my_char.thirst))) {
            //TODO питаться если не полное здоровье/мана!!!
        if (test) echo('-->[not so hunger/thirst - EXIT]');
        return;
    }

    if (['fight', 'stun', 'incap', 'mort', 'dead'].indexOf(mudprompt.p2.pos) !== -1) {
        return;
    }

    if (my_char.afk) {
        changeAFK();
        my_char.needsChanged = true;
        return;
    }
    if(mudprompt['trv']!==undefined && mudprompt['trv']!=='none' && mudprompt['trv'].a.indexOf('F')!==-1) {
        my_char.was_fade = true;
    }
    //[#food]
    if (my_char.hunger) {
        if (!my_char.lfood) {
            if (my_char.food == 'manna' || my_char.food == 'mushroom') {
                if (checkPose('stand')) {
                    my_char.needsChanged = true;
                    doAct('cast', 'create food');
                    return;
                }
            }
            if (my_char.food === 'rusk') {
                if (checkPose('rest')) {
                    my_char.needsChanged = true;
                    doAct('get rusk pack');
                    return;
                }
            }
        } else {
            if (checkPose('rest')) {
                my_char.needsChanged = true;
                doAct('eat', my_char.food);
                return;
            }
        }

        if (my_char.action.act !== undefined) return;
    }
    //[#drink]
    if (my_char.thirst) {
        if(test) echo("-->хочу пить!(lwater:"+my_char.lwater+")");
        if (!my_char.lwater) {
            if (my_char.water === 'spring') {
                if (checkPose('stand')) {
                    my_char.needsChanged = true;
                    doAct('cast', 'create spring');
                    return;
                }
            }
            if (my_char.water === 'flask') {
                if (test) echo('->(water === flask)');
                if (test) echo('-->(create water=' + my_char.spells.indexOf('create water') + ')');
                if(test) console.log(my_char.spells);
                if (my_char.spells.indexOf('create water') !== undefined) {
                    if (test) echo('->(create water !== undefined)');
                    if (checkPose('stand')) {
                        my_char.needsChanged = true;
                        doAct('cast', 'create water', my_char.water);
                        return;
                    }
                }

            }
        } else {
            if (checkPose('stand')) {
                my_char.needsChanged = true;
                doAct('drink', my_char.water);
                return;
            }
        }
    }
    //[#ruler badge]
    if (my_char.ruler_badge===false && my_char.hasSpell("ruler badge")
        && my_char.action.act==undefined) {
        if (checkPose('stand')) {
            my_char.needsChanged = true;
            doAct('cast','ruler badge');
            return;
        }
    }

}
function checkPose(need_pose) {
    if (test) echo('->checkPose(' + need_pose + ')');
    if (need_pose == mudprompt.p2.pos)
        return true;

    if (need_pose == 'rest' && mudprompt.p2.pos !== 'sleep')
        return true;

    my_char.last_pose = mudprompt.p2.pos;
    doAct(need_pose);
    return false;
}
function changeAFK() {
    my_char.was_afk = my_char.afk ? true : false;
    doAct('afk');
}
function restoreStatus() {
    if (test) echo('->restoreStatus()');
    if (test && my_char.last_pose != undefined) echo('[last:' + my_char.last_pose + ']');
    if (test && my_char.was_afk) echo('[was_afk]');
    if (test && my_char.was_fade) echo('[was_fade]');
    if (my_char.action.act !== undefined) {
        if (test) echo('[' + my_char.action.act + '->EXIT]');
        return;
    }
    if (my_char.was_fade !== undefined && !((mudprompt['trv']!==undefined && mudprompt['trv']!=='none') && mudprompt['trv'].a.indexOf('F')!==-1)) {
        doAct('fade');
        return;
    }
    if (my_char.last_pose !== undefined && my_char.last_pose != mudprompt.p2.pos) {
        doAct(my_char.last_pose);
        return;
    }
    if (my_char.was_afk && !my_char.afk) {
        doAct('afk');
        return;
    }
}

//[#Конструкторы]
function Action(act, command, target) {
    this.act = act===undefined ? undefined : act; //spelling, wearing, drinking, eating, getting, slooking
    this.command = command===undefined ? undefined : command;
    this.target = target===undefined ? undefined : target;
}

function GroupMember(name, index_name) {
    //if(test) echo(' -->GroupMember('+index_name+')');
    this.name = name;
    this.index_name = index_name;
    this.align = pets[name] != undefined ? pets[name].align : 'n';
    this.buffs = {};
}
function Group() {
    this.members = {};
    this.spells = [];
}
function MemberSpell(member_name, member_level) {
    this.member = member_name;
    this.level = member_level;
}

function Pchar(name, char, level) {
    if (test)
        echo(' -->Pchar() (name:' + name + ';weapon:' + (char===undefined?undefined:char.weapon) + ')');

    this.init = name===undefined ? false : true; 
    this.afk = false;

    this.pract = false; //признак состояния прокачки скилов
    this.last_pose = undefined;
    this.was_afk = undefined;
    this.was_fade = undefined;

    this.name = name===undefined ? undefined : name;
    this.level = level===undefined ? undefined : level;

    this.ruler_badge = (char===undefined || char.clan!='ruler') ? undefined : false;
    this.weapon = char===undefined ? undefined : char.weapon;
    this.align = char===undefined ? undefined : char.align;
    this.buffs_needs = char==undefined ? {} : char.buffs_needs;
    //[#armed] 0 - без оружия(оружие на земле), 1 - оружие в мешке, 2 - вооружен
    this.armed = false;

    this.food = char===undefined ? undefined : char.food;
    this.water = char===undefined ? undefined : char.water;
    this.thirst = 0;
    this.hunger = 0;
    this.lfood = false;
    this.lwater = false;

    //[#action] act - команда к выполеннию (н-р: \\get, \\wield, cast)
    //          command - 'acid blast' | target 
    //          target - цель
    this.action = new Action();

    this.ordersChange = false;

    this.spells = getSpells(char, level);
    this.hasBuff = function(cast){
        if((mudprompt[buffs_list[cast].mgroup]!==undefined && mudprompt[buffs_list[cast].mgroup]!=='none') && mudprompt[buffs_list[cast].mgroup].a.indexOf(buffs_list[cast].mbrief)!==-1){
            if(test) echo("------>Pchar->hasBuff("+cast+")->have one in mudprompt!");
            return true;
        } else if(this.buffs.isSet(cast)) { 
            if(test) echo("------>Pchar->hasBuff("+cast+")->have one in my_char.buffs!");
            return true;
        }


        if(buffs_list[cast].ally!=undefined) {
            for(let ally of buffs_list[cast].ally) {
                if((mudprompt[buffs_list[ally].mgroup]!==undefined && mudprompt[buffs_list[ally].mgroup]!=='none') && mudprompt[buffs_list[ally].mgroup].a.indexOf(buffs_list[ally].mbrief)!==-1){
                    if(test) echo("------>Pchar->hasBuff("+cast+")->have ally("+ally+")!");
                    return true;
                } else if (this.buffs.isSet(ally)) { 
                    if(test) echo("------>Pchar->hasBuff("+cast+")->have ally("+ally+") in my_char.buffs!");
                    return true;
                }
            }
        }
        if(test) echo("------>Pchar->hasBuff=>FALSE");
        return false;
    };
    this.hasSpell = (spell) => this.spells.indexOf(spell) >= 0 ? true : false;

    this.fullbuff = new Fullbuff();

	this.order = new Order();

    this.group = new Group();
    this.buffs = {
        list: {},
        set : function(spell) {
            this.list[spell] = spell;
        },
        get : function(spell) {
            return this.list[spell];
        },
        remove : function(spell) {
            this.list[spell] = undefined;
        },
        isSet : function(spell) {
            return this.get(spell) != undefined;
        }
    };
    this.attack_spells = {
        list:{
            close:[],
            range:[],
            curse:[],
            room:[],
        },
        set: undefined,
        get_prompt: function() {
            let groups_hints = {
                "range":{
                    short: 'rng',
                    key: '>',
                    alts: ['c','c+a'],
                },
                "close":{
                    short: 'cls',
                    key: '+',
                    alts: ['','c','s'],
                },
                "curse":{
                    short: 'crs',
                    key: '-',
                    alts: ['','c','s'],
                },
                "room":{
                    short: 'rm',
                    key: '.',
                    alts: ['','c','s'],
                },
            };
            let result = "";
            if(this.set==undefined) {
                this.set_attack_spells();
            }
            for(let group in groups_hints) {
                if(this.set[numpad_set][group]==undefined || this.set[numpad_set][group].length==0) continue;

                result += "<b>[</b>"+groups_hints[group].short+"["+groups_hints[group].key+"]:";
                for(let key in this.set[numpad_set][group]) {
                    if(key>0) result += "/";
                    result += '<b>'+attack_spells_list[this.set[numpad_set][group][key]].short+'</b>'
                        + (groups_hints[group].alts[key]!='' ? '['+groups_hints[group].alts[key]+']' : '');
                }

                result += "<b>]</b> ";
            }
            return result!="" ? ("("+numpad_set+") "+result) : result;

        },
        set_attack_spells: function() {
            this.set = []
            this.set[numpad_set]={};
            for(let spell of my_char.spells) {
                if(attack_spells_list[spell]==undefined) continue;

                if(attack_spells_list[spell].class=="room" || attack_spells_list[spell].area) 
                    this.addSpell(spell,'room');

                if(attack_spells_list[spell].range) 
                    this.addSpell(spell,'range');

                if(attack_spells_list[spell].target && attack_spells_list[spell].class=="attack") 
                    this.addSpell(spell,'close');

                if(attack_spells_list[spell].class=="maladiction") 
                    this.addSpell(spell,'curse');
            }   
            //console.log(this);
        },
        addSpell:function(spell,group) {
            let max_key = group=='range' ? 2 : 3;
            this.list[group].push(spell);
            if(this.set[numpad_set][group]==undefined) 
                this.set[numpad_set][group] = [];
            
            if(this.set[numpad_set][group].length >= max_key)
                return;

            for(let key = 0; key<max_key; key++)
                if(this.set[numpad_set][group][key]==undefined){
                    this.set[numpad_set][group][key]=spell;
                    break;
                }
        },
        changeSpell:function(group,key){
            let curr_spell = my_char.attack_spells.set[numpad_set][group][key];
            let new_index = my_char.attack_spells.list[group].indexOf(curr_spell)+1;
            if(new_index>=my_char.attack_spells.list[group].length) new_index = 0;

            my_char.attack_spells.set[numpad_set][group][key] = my_char.attack_spells.list[group][new_index];

            echo(this.get_prompt());
        },
        showSpells:function(group,key) {
            let result = '';
            for(let i in my_char.attack_spells.list[group]){
                result += "["+i+"."+my_char.attack_spells.list[group][i]+"]";
            }
            echo(result);
        },
        get_spell: function(group,key){
            return my_char.attack_spells.set[numpad_set][group][key];
        },
    };
}

function Fullbuff(bclass, btarget, all) {
    if(test) echo('->Fullbuff('+bclass+','+btarget+','+all+')');
	this.class = bclass === undefined ? undefined : bclass;
	this.target = btarget === undefined ? undefined : btarget;
	this.all = all === undefined ? false : all;
	this.buffs = {};
    this.empty = [];
    this.away = [];
    this.hasBuff = function (ch_name, spell_name) {
        if(ch_name==my_char.name) {
            if(my_char.hasBuff(spell_name)) {
                if(test)echo("------->Fullbuff->hasBuff(has one)");
                return true;
            }
            if(buffs_list[spell_name].antogonist!=undefined) {
                for(let antogonist of buffs_list[spell_name].antogonist) {
                    if(my_char.hasBuff(antogonist)) {
                        if(test)echo("------->Fullbuff->hasBuff(has antogonist: "+antogonist+")");
                        return true;
                    }
                }
            }
            if(buffs_list[spell_name].ally!=undefined) {
                for(let ally of buffs_list[spell_name].ally) {
                    if(my_char.hasBuff(ally)) {
                        if(test)echo("------->Fullbuff->hasBuff(has ally: "+ally+")");
                        return true;
                    }
                }
            }
        } else if (my_char.group.members[ch_name]!=undefined) {
            if(my_char.group.members[ch_name].buffs[spell_name]) {
                if(test)echo("------->Fullbuff->hasBuff(member have one)");
                return true;
            }
            if(buffs_list[spell_name].antogonist!=undefined) {
                for(let antogonist in buffs_list[spell_name].antogonist) {
                    //my_char.group.members[target_name].buffs[spell_name]
                    if(my_char.group.members[ch_name].buffs[antogonist]) {
                        if(test)echo("------->Fullbuff->hasBuff(member has antogonist: "+antogonist+")");
                        return true;
                    }
                }
            }
            if(buffs_list[spell_name].ally!=undefined) {
                for(let ally in buffs_list[spell_name].ally) {
                    if(my_char.group.members[ch_name].buffs[ally]) {
                        if(test)echo("------->Fullbuff->hasBuff(member has ally: "+ally+")");
                        return true;
                    }
                }
            }
        } else {
            if(my_char.fullbuff.buffs[spell_name]) {
                if(test) echo("------->Fullbuff->hasBuff(target have one)");
                return true;
            }
            if(buffs_list[spell_name].antogonist!==[]) {
                for(let antogonist in buffs_list[spell_name].antogonist) {
                    //my_char.group.members[target_name].buffs[spell_name]
                    if(my_char.fullbuff.buffs[antogonist]) {
                        if(test)echo("------->Fullbuff->hasBuff(target has antogonist: "+antogonist+")");
                        return true;
                    }
                }
            }
            if(buffs_list[spell_name].ally!==[]) {
                for(let ally in buffs_list[spell_name].ally) {
                    if(my_char.fullbuff.buffs[ally]) {
                        if(test)echo("------->Fullbuff->hasBuff(target has ally: "+ally+")");
                        return true;
                    }
                }
            }
        }
        if(test)echo("------->Fullbuff->hasBuff()==FALSE!")
        return false;
    }
}

function Order(comm) {
	this.command = comm===undefined ? undefined : comm;
	this.proced = comm===undefined ? undefined : 0;
    this.name_num = [];
}

function getSpells(char, level) {
    let spells = [], result = [];
    if (char!==undefined && char.clan === 'invader') {
        spells.push(['shadow cloak',10]);
        spells.push(['shadowlife',30]);
        spells.push(['evil spirit',33]);
        spells.push(['nightfall',16]);
    }
    if (char!==undefined && char.clan === 'ruler') {
        spells.push(['ruler aura',10]);
        spells.push(['ruler badge',10]);
    }
    if (char!==undefined && char.class === 'cleric') {
        spells.push(['heal',2]);spells.push(['harm',2]);spells.push(['create water',3]);spells.push(['refresh',7]);spells.push(['create food',8]);spells.push(['observation',10]);spells.push(['cure blindness',11]);spells.push(['detect evil',11]);spells.push(['detect good',11]);spells.push(['shield',12]);spells.push(['blindness',14]);spells.push(['faerie fire',15]);spells.push(['detect magic',15]);spells.push(['fireproof',16]);spells.push(['earthquake',19]);spells.push(['cure disease',19]);spells.push(['armor',20]);spells.push(['bless',20]);spells.push(['continual light',21]);spells.push(['poison',22]);spells.push(['summon',22]);spells.push(['cure poison',23]);spells.push(['weaken',24]);spells.push(['infravision',25]);spells.push(['calm',26]);spells.push(['heating',27]);spells.push(['dispel evil',27]);spells.push(['dispel good',27]);spells.push(['create spring',27]);spells.push(['control weather',28]);spells.push(['sanctuary',29]);spells.push(['fly',30]);spells.push(['locate object',30]);spells.push(['enchant armor',30]);spells.push(['awakening',31]);spells.push(['faerie fog',31]);spells.push(['teleport',32]);spells.push(['remove curse',32]);spells.push(['pass door',32]);spells.push(['word of recall',32]);spells.push(['cancellation',32]);spells.push(['curse',33]);spells.push(['plague',33]);spells.push(['enhanced armor',33]);spells.push(['remove fear',34]);spells.push(['frenzy',34]);spells.push(['portal',35]);spells.push(['learning',35]);spells.push(['mental block',35]);spells.push(['gate',35]);spells.push(['mind light',36]);spells.push(['identify',36]);spells.push(['stone skin',36]);spells.push(['ray of truth',37]);spells.push(['bluefire',37]);spells.push(['weapon morph',37]);spells.push(['superior heal',38]);spells.push(['slow',38]);spells.push(['protective shield',38]);spells.push(['protection heat',39]);spells.push(['giant strength',39]);spells.push(['dragon skin',40]);spells.push(['healing light',41]);spells.push(['cursed lands',41]);spells.push(['sanctify lands',41]);spells.push(['flamestrike',42]);spells.push(['energy drain',42]);spells.push(['dispel affects',43]);spells.push(['protection cold',44]);spells.push(['severity force',45]);spells.push(['group defense',45]);spells.push(['improved detect',45]);spells.push(['holy word',48]);spells.push(['inspire',49]);spells.push(['cure corruption',50]);spells.push(['aid',53]);spells.push(['nexus',55]);spells.push(['master healing',58]);spells.push(['desert fist',58]);spells.push(['blade barrier',60]);spells.push(['group heal',65]);spells.push(['restoring light',71]);spells.push(['benediction',80]);//spells.push(['detect invis',17]);
    }
    if (char!==undefined && char.class === 'necromancer') {
        spells.push(['dark shroud',21]);
        spells.push(['shield',12]);
        spells.push(['protective shield',18]);
        spells.push(['armor',20]);
        spells.push(['stone skin',30]);
        spells.push(['protection good',17]);
        spells.push(['spell resistance',69]);
        spells.push(['mental block',36]);
        spells.push(['magic concentrate',60]);
        spells.push(['protection negative',15]);
        spells.push(['protection cold',50]);
        spells.push(['giant strength',28]);
        spells.push(['detect invis',6]);
        spells.push(['improved detect',40]);
        spells.push(['infravision',21]);
        spells.push(['fly',23]);
        spells.push(['pass door',27]);
        //spells.push(['learning',33]);
        //spells.push(['create water',11]);
        //spells.push(['create food',12]);
        //spells.push(['create spring',31]);
        spells.push(['disruption',40]);
        spells.push(['acid blast',63]);
        spells.push(['hand of undead',44]);
        spells.push(['magic missile',1]);
        //spells.push(['acid arrow',48]);
        spells.push(['burning hands',10]);
        spells.push(['chill touch',5]);
        spells.push(['sonic resonance',28]);
        spells.push(['lightning ward ',41]);
        spells.push(['lightning bolt',23]);
        spells.push(['chain lightning',33]);
        spells.push(['spectral furor',35]);
        spells.push(['hurricane',65]);
        spells.push(['cursed lands',64]);
        spells.push(['mysterious dream',27]);
        spells.push(['shielding',53]);
        spells.push(['energy drain',45]);
        spells.push(['magic jar',68]);
        spells.push(['power word kill',78]);
        spells.push(['insanity',59]);
        spells.push(['curse',34]);
        spells.push(['plague',36]);
        spells.push(['corruption',63]);
        spells.push(['web',58]);
        spells.push(['blindness',22]);
        spells.push(['poison',23]);
        spells.push(['slow',29]);
        spells.push(['weaken',100]);
        spells.push(['fear',51]);
        spells.push(['dispel affects',24]);
        spells.push(['evil spirit',33]);
    }
    for(let aSpell of spells) {
        if(aSpell[1] <= level) //&& (buffs_list[aSpell[0]]!==undefined || attack_spells_list[aSpell[0]]!==undefined)
            result.push(aSpell[0]);
    }
    if(test) {
        console.log("getSpells() --> result:");
        console.log(result);
    }
    return result;
}

function getBuffClass(text) {
	/*
	det - detection, 
	trv - transport&travel
    enh - fightmaster&enhancement, 
	pro - protective,
    cln - clan skills and spells
	*/
	// detection  protective
	if (text.match('^def.*|^pro.*')) {
    	return 'protective';
	}
	if (text.match('^det')) {
    	return 'detection';
	}
	return false;
}
function BuffQueue(sBuff, lStatus, lActionDone, action) {
	this.sBuff = sBuff;
	this.lStatus = lStatus;
	this.lActionDone = lActionDone;
	this.action = action;
}
var buffPatterns = [
	// pattern, status, active
    ['ruler aura', '^Аура Правителя исчезает, и ты теряешь возможность видеть незримое иным.$', false, false],
	['ruler aura', '^Жемчужно-серая аура Правителя окружает тебя, даруя способность видеть незримое иным.$', true, true],
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
 	['armor', '^.* окружает священная броня, дарованная .*.$', true, true],
	['armor', '^Тебя окружает священная броня, дарованная .*$', true, true],
    //['armor', '^Волшебная броня окружает .*.$', true, true],
	['armor', '^.* окружает магическая броня, улучшающая защитные навыки.$', true, true],
	//['armor', '^.* уже защищен(а)? заклинанием брони.$', true, true],
	['armor', '^.* уже под воздействием этого заклинания брони.$', true, true],
	['armor', '^Ты уже под воздействием заклинания брони.$', true, true],
    ['shield', '^Щит, окружавший тебя, исчезает.$', false, false],
	['shield', '^Божественная энергия окружает .* щитом.$', true, true],
    ['shield', '^.* окружает священный щит, дарованный .*\.', true, true],
	['shield', '^Тебя окружает священный щит, дарованный .*\.$', true, true],
	//['shield', '^Волшебный щит окружает .*.$', true, true],
    ['shield', '^.* окружает магический щит, помогающий блокировать удары.$', true, true],
	//['shield', '^.* уже защищен(а)? заклинанием щита.$', true, true],
	['shield', '^.* уже под воздействием этого заклинания.$', true, true],
	['enhanced armor', '^Силовое поле, защищавшее тебя, исчезает.$', false, false],
	//['enhanced armor', '^Силовая защита окружает .*.$', true, true],
    ['enhanced armor', '^.* окружает силовое поле, дарованное .*.$', true, true],
    ['enhanced armor', '^Тебя окружает силовое поле, помогающее уходить от ударов.*.$', true, true],
    ['enhanced armor', '^Тебя окружает силовое поле, дарованное .*$', true, true],
//	['enhanced armor', '^Силовое поле уже защищает тебя.$', true, true],
	['enhanced armor', 'Ты уже под защитой силового поля.$', true, true],
	['enhanced armor', '.* уже под защитой силового поля\.$', true, true],
	['enhanced armor', '^Силовое поле уже окружает .*.$', true, true],
	['bless', '^Ты больше не чувствуешь божественного благословления.$', false, false],
	['bless', '^Ты больше не чувствуешь божественного благословения.$', false, false],
	['bless', '^Ты чувствуешь благословение .*!$', true, true],
	['bless', '^Ты чувствуешь божественное благословение.$', true, true],
	['bless', '^.* уже благословлен\.$', true, true],
	['bless', '.* уже под воздействием этого заклинания\.$', true, true],
	['bless', '^Ты даришь .* благословение своих богов\.$', true, true],
	['bless', '^Благословение .* снисходит на .*\.$', true, true],
	['bless', '^Благословение богов снисходит на .*\.$', true, true],
	['sanctuary', '^Белая аура вокруг тебя исчезает.$', false, false],
	['sanctuary', '^Белая аура окружает .*.$', true, true],
	['sanctuary', '^Вокруг .* вспыхивает белая аура, дарованная .*.$', true, true],
	['sanctuary', '^.* уже под защитой святилища.', true, true],
	['sanctuary', '^Аура святилища уже защищает .*.', true, true],
	['sanctuary', 'Аура святилища уже защищает тебя.$', true, true],
	['sanctuary', '^.* уже под защитой темных богов.', true, true],
	['observation', '^Ты больше не видишь состояния других.$', false, false],
	['observation', '^Теперь ты замечаешь состояние других.$', true, true],
	['observation', '^Теперь ты можешь диагностировать негативные аффекты других существ.$', true, true],
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
	['frenzy', '^Волею .* глаза .*зажигаются диким огнем!$', true, true],
	['frenzy', '^Твои боги не благосклонны к ', true, true],
	['frenzy', '^Сейчас ничто не может разозлить ', true, true],
	['frenzy', '^.* уже в ярости!$', true, true],
    ['frenzy', 'молит о неистовстве, но богам явно не по душе .*$', true, true],
	['stone skin', '^Твоя кожа становится мягче.$', false, false],
    ['stone skin', '^Каменная корка на твоей коже трескается под ударами и исчезает.$', false, false],
	//['stone skin', '^Твоя кожа становится тверже камня.$', true, true],
    ['stone skin', '^Твоя кожа становится серой, превращаясь в камень.$', true, true],
    ['stone skin', '^Кожа .* становится серой, превращаясь в камень.$', true, true],
	['stone skin', 'Твоя кожа уже тверда как камень.$', true, true],
	['dragon skin', '^Твоя кожа становится мягче.$', false, false],
	['dragon skin', '^Твоя кожа уже тверда, как драконья.$', true, true],
	['dragon skin', '^Твоя кожа становится тверже драконьей.$', true, true],
	['dragon skin', '^Твоя кожа покрывается драконьей чешуей.$', true, true],
	['protective shield', '^Охранный щит вокруг тебя исчезает.$', false, false],
	//['protective shield', '^Охранный щит окружает тебя.$', true, true],
    ['protective shield', '^.* окружает тускло светящийся охранный щит, отклоняющий резкие толчки и удары.$', true, true],
	['protective shield', '^Охранный щит уже окружает тебя.$', true, true],
	['protective shield', '^Тебя окружает тускло светящийся охранный щит, дарованный .*.$', true, true],
	['protective shield', 'Ты уже под воздействием охранного щита.$', true, true],
	['protective shield', '^Предохранительный щит окружает тебя.$', true, true],
	['giant strength', '^Ты становишься слабее.$', false, false],
	['giant strength', '^Слабость проходит... но лишь на мгновение.$', false, true],
	['giant strength', '^Ты чувствуешь, как силы возвращаются к тебе.$', false, true],
//	['giant strength', ' станови[тшь]{1,2}ся намного сильнее.$', true, true],
	['giant strength', '^Ты становишься намного сильнее!$', true, true],
	['giant strength', '^.* напрягает мускулы, становясь намного сильнее!$', true, true],
//	['giant strength', '^.* не може[тшь]{1,2} быть еще сильнее.$', true, true],
	['giant strength', '^(Ты||.*) уже обладае(шь||ет) гигантской силой.$', true, true],
	['giant strength', ' уже обладает гигантской силой.$', true, true],
	['protection heat', '^Твоя защищенность от воздействия высоких температур понижается.$', false, false],
	['protection heat', '^Твоя защищенность от воздействия высоких температур повышается.$', true, true],
	['protection heat', '^Ты теперь лучше защищен от воздействия высоких температур.$', true, true],
	['protection heat', '^Ты уже защищен от огня.$', true, true],
//	['protection cold', '^Твоя защищенность от воздействия низких температур повышается.$', true, true],
	['protection cold', '^Ты теперь лучше защищен от воздействия низких температур.$', true, true],
	['protection cold', '^Ты уже защищен от холода.$', true, true],
//	['protection cold', '^Твоя защищенность от воздействия низких температур понижается.$', false, false],
	['protection cold', '^Ты теряешь защиту от воздействия низких температур.$', false, false],
	['inspire', '^Твое воодушевление проходит.$', false, false],
	['inspire', '^Ты чувствуешь воодушевление!$', true, true],
	['inspire', '^Ты уже воодушевлен.$', true, true],
	//['detect invis', '^Ты более не чувствуешь присутствие невидимых сил.$', false, false],
	['detect invis', '^Ты больше не видишь невидимое.$', false, false],
//	['detect invis', '^Теперь ты чувствуешь присутствие невидимых сил.$', true, true],
	['detect invis', '^Теперь ты можешь увидеть невидимое.$', true, true],
//	['detect invis', '^Ты уже чувствуешь присутствие невидимых сил.$', true, true],
	['detect invis', '^Ты уже видишь невидимое.$', true, true],
	['detect invis', '^Глаза .* сужаются, получая способность видеть невидимое.$', true, true],
	['detect magic', '^Теперь ты чувствуешь ауру магии вокруг предметов и существ.$', true, true],
	['detect magic', '^Ты больше не различаешь ауру магии вокруг предметов и существ.$', false, false],
	['infravision', '^Твои глаза загораются красным светом.$', true, true],
//	['improved detect', '^Ты теперь не замечаешь очень невидимые силы.$', false, false],
	['improved detect', '^Твои глаза расслабляются, теряя способность видеть очень невидимое.$', false, false],
//	['improved detect', '^Теперь ты чувствуешь присутствие очень невидимых сил.$', true, true],
	['improved detect', '^Теперь ты можешь увидеть очень невидимое.$', true, true],
//	['improved detect', '^Ты уже чувствуешь присутствие очень невидимых сил.$', true, true],
	['improved detect', '^Ты уже видишь очень невидимое.$', true, true],
	['invisibility', '^Ты появляешься из ниоткуда.$', false, false],
	['invisibility', '^Теперь окружающие видят тебя.$', false, false],
	['invisibility', '^Ты становишься невидимым.$', true, true],
	['invisibility', '^Тебя уже и так не видно.$', true, true],
	['improved invis', '^Ты становишься видимым для окружающих.$', false, false],
	['improved invis', '^Ты становишься совсем невидимым.$', true, true],
	['infravision', '^Ты более не видишь в темноте.$', false, false],
	['infravision', '^Твои глаза загораются красным светом.$', true, true],
	['infravision', '^Ты уже видишь в темноте.$', true, true],
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
    //['haste', '^Твои движения становятся намного быстрее.$', true, true],
	['haste', '^Твои движения и метаболизм ускоряются!$', true, true],
    //['haste', '^Ты не можешь двигаться быстрее, чем сейчас!$', true, true],
    ['haste', 'Ты уже мечешься вокруг как ежик Соник.$', true, true],
	['haste', ' не может двигаться еще быстрее.$', true, true],
	//['mental block', '^Теперь ты будешь блокировать все попытки ментального контакта с тобой.$', true, true],
	['mental block', '^Вокруг твоей головы возникает кокон, защищая от транспортных заклятий.$', true, true],
	['mental block', '^Вокруг головы .* возникает кокон, защищая от транспортных заклятий.$', true, true],
	['mental block', '^Ты уже блокируешь все попытки ментального контакта.$', true, true],
	['mental block', '^.* уже блокирует все попытки ментального контакта.$', true, true],
	['mental block', '^Ты теряешь способность блокировать ментальный контакт.$', false, false],
	['transform', '^Здоровье, приданное тебе магией, исчезает прочь.$', false, false],
	['transform', '^Прилив жизненной силы затмевает твой разум.$', true, true],
	['transform', '^Ты уже переполнен жизненной энергией.$', true, true],
	//['magic concentrate', '^Ты чувствуешь, как сверхмощная способность к разрушению заполняет все твое тело.', true, true],
	['magic concentrate', '^Меж твоих ладоней вспыхивает яркая искра, даруя способность фокусировать магию.', true, true],
//	['magic concentrate', '^Ты уже достаточно сконцентрирован.', true, true],
	['magic concentrate', '^Ты уже готов фокусировать магию.', true, true],
//	['magic concentrate', '^Ты теряешь невидимую нить, связывающую тебя с источником магической силы.', false, false],
	['magic concentrate', '^Искра между твоих ладоней исчезает, и ты теряешь способность фокусировать магию.', false, false],
	//['spell resistance', '^Теперь заклинания причиняют тебе меньший вред.', true, true],
	['spell resistance', '^Ты окутываешься энергетическим коконом, защищающим от заклинаний.', true, true],
	//['spell resistance', '^Ты уже имеешь эту защиту.', true, true],
    ['spell resistance', 'Ты уже устойчив(а)? к заклинаниям.$', true, true],
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
    ['dark shroud', '^.* уже под воздействием темной ауры, этого достаточно.', true, true],
    ['sanctuary', '^.* уже под воздействием темной ауры, этого достаточно.', true, true],
    ['stardust', '^.* уже под воздействием темной ауры, этого достаточно.', true, true],
    ['dark shroud', '^Темная аура защитит только злых персонажей.$', true, true],
//	['protection negative', '^Ты беззащитен перед своими атаками.$', false, false],
	['protection negative', '^Багровый щит, защищающий тебя от темной энергии, исчезает.$', false, false],
//	['protection negative', '^Ты приобретаешь иммунитет к негативным атакам.$', true, true],
	['protection negative', '^Ты окутываешься багровым щитом, получая сопротивляемость к темной энергии.$', true, true],
//	['protection negative', '^У тебя уже есть иммунитет к негативным атакам.', true, true],
	['protection negative', '^Ты уже защищен от темной энергии.', true, true],
	['shadow cloak', '^Призрачная мантия, окутывавшая тебя, тает.$', false, false],
	['shadow cloak', '^Жажда чужих душ стихает внутри тебя.$', false, false],
	//['shadow cloak', '^Призрачная мантия окутывает тебя.$', true, true],
    ['shadow cloak', '^Призрачная мантия окутывает тебя. Ты погружаешься во тьму.$', true, true],
    ['shadow cloak', '^Призрачная мантия уже защищает тебя.$', true, true],
    ['shadow cloak', '^В тебе загорается огонь, жаждущий душ ангелов.$', true, true],
	['shadow cloak', '^Призрачная мантия уже защищает тебя.$', true, true],
	['shadow cloak', '^Жажда душ уже горит в тебе.$', true, true],

	['detect undead', '^Ты перестаешь чувствовать мертвецов.$', false, false],
	['detect undead', '^Теперь ты чувствуешь нежить.$', true, true],
	['detect undead', '^Ты уже чувствуешь нежить.', true, true],
];
var pets = {
    'Легенда': {
        'spells' : ['armor', 'acute vision', 'continual light', 'control weather', 
            'create food', 'create rose', 'create spring', 'detect invis', 'dragon skin', 
            'enhanced armor', 'faerie fog', 'fly', 'giant strength', 'haste', 'improved detect', 
            'improved invis', 'infravision', 'invisibility', 'knock', 'learning', 'link', 
            'pass door', 'protection cold', 'protection heat', 'protective shield', 'refresh',
            'shield', 'spell resistance', 'stardust', 'stone skin'
        ],
        'align' : 'n',
        'ename' : 'legend',
    },
    'коровища': {
        'spells' : ['aid', 'armor', 'bless', 'calm', 'continual light', 'control weather', 'create food', 'create spring', 'cure blindness', 'cure disease', 'cure poison', 'detect invis', 'dragon skin', 'enhanced armor', 'faerie fog', 'fly', 'frenzy', 'giant strength', 'group defense', 'group heal', 'heal', 'healing light', 'improved detect', 'infravision', 'inspire', 'learning', 'mind light', 'pass door', 'protection cold', 'protection heat', 'protective shield', 'refresh', 'remove curse', 'remove fear', 'restoring light', 'sanctify lands', 'sanctuary', 'shield', 'stone skin'
        ],
        'align' : 'n',
        'ename' : 'cow',
    },
    'ночная тен' :{
        'spells' : ['armor', 'assist', 'create food', 'create spring', 'dark shroud', 'detect invis', 'fly', 'giant strength', 'improved detect', 'infravision', 'invisibility', 'knock', 'learning', 'link', 'pass door', 'protection cold', 'protection good', 'protection negative', 'protective shield', 'refresh', 'shield', 'spell resistance', 'stone skin'],
        'align' : 'e',
        'ename' : 'night'
    },
    'призванная' :{
        'spells' : ['armor', 'assist', 'create food', 'create spring', 'detect invis', 'fly', 'giant strength', 'improved detect', 'infravision', 'invisibility', 'knock', 'learning', 'link', 'pass door', 'protection cold', 'protection negative', 'protective shield', 'refresh', 'shield', 'spell resistance', 'stone skin'],
        'align' : 'n',
        'ename' : 'shadow',
    },
    'теневой дв':{
        'spells' : ['armor', 'assist', 'create food', 'create spring', 'detect invis', 'fly', 'giant strength', 'improved detect', 'infravision', 'invisibility', 'knock', 'learning', 'link', 'pass door', 'protection cold', 'protection negative', 'protective shield', 'refresh', 'shield', 'spell resistance', 'stone skin'],
        'align' : 'n',
        'ename' : 'shadow',
    },
    "каменный г" : {
        'spells' : [],
        'align' : 'n',
        'ename' : 'stone',
    },
    "малый голе" : {
        'spells' : [],
        'align' : 'n',
        'ename' : 'lesser',
    },
    "железный г" : {
        'spells' : [],
        'align' : 'n',
        'ename' : 'iron',
    },
    "адамантито" : {
        'spells' : [],
        'align' : 'n',
        'ename' : 'adamantite',
    },
    
};

var buffs_list = {
    'rainbow shield': new Spell('rainbow shield', 'R', 'pro','protective'),
    'group defense': new Spell('group defense', 'gd', 'pro', 'protective', false, true,[],["shield","armor","sanctuary"]),
    'inspire': new Spell('inspire', 'i','enh','protective', false, true),

    //invader:
    'shadow cloak': new Spell('shadow cloak', 'S', 'cln', 'protective'),

    //ruler:
    'ruler aura': new Spell('ruler aura', 'A', 'cln', 'protective',false,false,[],['detect invis']),

    //protect:
    //necr
    'dark shroud': new Spell('dark shroud', 'd', 'pro', 'protective', true, false,[],['stardust','sanctuary'],undefined,'e'),
    'shield':  new Spell('shield', 'S', 'pro', 'protective',true , false,[],[],'group defense'),
    'protective shield': new Spell('protective shield','p', 'pro', 'protective'),
    'armor': new Spell('armor', 'a', 'pro', 'protective', true, false,[],[],'group defense'),
    'stone skin': new Spell('stone skin', 'k', 'pro', 'protective'),
    'protection good': new Spell('protection good', 'g', 'pro', 'protective'),
    'spell resistance': new Spell('spell resistance', 'm', 'pro', 'protective', false, false,[],['rainbow shield']),
    'mental block': new Spell('mental block', 'm', 'trv', 'protective', true),
    'magic concentrate': new Spell('magic concentrate', 'm', 'enh', 'protective'),
    'protection negative': new Spell('protection negative', 'n', 'pro', 'protective'),
    'protection cold': new Spell('protection cold', 'c', 'pro', 'protective'),
    'giant strength': new Spell('giant strength', 'g', 'enh', 'protective', true),
    'detect invis': new Spell('detect invis', 'i', 'det', 'detection'),
    'improved detect': new Spell('improved detect', 'w', 'det', 'detection'),
    'infravision': new Spell('infravision', 'r', 'det', 'detection'),
    'detect magic': new Spell('detect magic', 'm', 'det', 'detection'),

    //pets:
    'stardust': new Spell('stardust', 'z', 'pro', 'protective', true, false,[],['dark shroud','sanctuary']),
    'sanctuary': new Spell('sanctuary', 's', 'pro', 'protective', true, false,[],['dark shroud','stardust'],'group defense'),
    'enhanced armor': new Spell('enhanced armor', 'A', 'pro', 'protective', true),
    'haste': new Spell('haste', 'h', 'enh', 'protective', true),
    'bless': new Spell('bless', 'b', 'enh', 'protective', true),
    'dragon skin': new Spell('dragon skin', 'D', 'pro', 'protective'),
    'frenzy': new Spell('frenzy', 'f', 'enh', 'protective', true, false, [],[],undefined,'ng'),
};
var attack_spells_list = {
    //AttackSpell(sName,sClass,lTarget,lRange,lArea,lFight,sDamage)
    //cleric
    'harm': new AttackSpell('harm','harm','attack',true,true,false,true),
    'bluefire': new AttackSpell('bluefire','blFr','attack',true,true,false,true),
    'heating': new AttackSpell('heating','heat','attack',true,false,false,true,'fire'),
    'ray of truth': new AttackSpell('ray of truth','RoT','attack',true,true,false,true),
    'flamestrike': new AttackSpell('flamestrike','flam','attack',true,true,false,true,'fire'),
    'severity force': new AttackSpell('severity force','SevF','attack',true,false,false,true),
    //RULER
    //optic resonance 
    //necromancer
    'shadowlife': new AttackSpell('shadowlife','shLf','maladiction',true,false,false,false),
    'magic missile': new AttackSpell('magic missile','mm','attack',true,true,false,true,'energy'),
    'acid blast': new AttackSpell('acid blast','aBst','attack',true,true,false,true,'acid'),
    'acid arrow': new AttackSpell('acid arrow','aArr','attack',true,true,false,true,'acid'),
    'burning hands': new AttackSpell('burning hands','burHnd','attack',true,false,false,true,'fire'),
    'chill touch': new AttackSpell('chill touch','chTch','attack',true,false,false,true,'cold'),
    'sonic resonance': new AttackSpell('sonic resonance','sonic','attack',true,true,false,true,'energy'),
    'lightning ward': new AttackSpell('lightning ward','lngW','room',false,false,true,false,'lightning'),
    'lightning bolt': new AttackSpell('lightning bolt','lngB','attack',true,true,false,true,'lightning'),
    'disruption': new AttackSpell('disruption','disr','attack',true,true,false,true,'energy'),
    'chain lightning': new AttackSpell('chain lightning','chLng','attack',true,false,true,true,'lightining'),
    'spectral furor': new AttackSpell('spectral furor','spect','attack',true,true,false,true,'energy'),
    'hurricane': new AttackSpell('hurricane','hur','attack',false,false,true,true,'other'),
    'cursed lands': new AttackSpell('cursed lands','curLd','room',false,false,true,false),
    'mysterious dream': new AttackSpell('mysterious dream','myst','room',false,false,true,false),
    'hand of undead': new AttackSpell('hand of undead','HoU','attack',true,true,false,true,'energy'),
    'shielding': new AttackSpell('shielding','shng','maladiction',true,false,false,false),
    'energy drain': new AttackSpell('energy drain','engDr','attack',true,false,false,true,'energy'),
    'insanity': new AttackSpell('insanity','ins','maladiction',true,false,false,true),
    'curse': new AttackSpell('curse','crs','maladiction',true,false,false,true),
    'plague': new AttackSpell('plague','plg','maladiction',true,false,false,true),
    'corruption': new AttackSpell('corruption','corr','maladiction',true,false,false,true),
    'magic jar': new AttackSpell('magic jar','jar','maladiction',true,false,false,false),
    'power word kill': new AttackSpell('power word kill','pwk','attack',true,false,false,false,'energy'),
    'web': new AttackSpell('web','web','maladiction',true,true,false,true),
    'blindness': new AttackSpell('blindness','blind','maladiction',true,false,false,true),
    'poison': new AttackSpell('poison','pois','maladiction',true,false,false,true),
    'slow': new AttackSpell('slow','slow','maladiction',true,false,false,true),
    'weaken': new AttackSpell('weaken','weak','maladiction',true,false,false,true),
    'fear': new AttackSpell('fear','fear','maladiction',true,false,false,true),
    'dispel affects': new AttackSpell('dispel affects','dispAff','maladiction',true,false,false,true),
    'evil spirit': new AttackSpell('evil spirit','evilSp','room',false,false,true,false),
}
function Buff_need(always, fullbuff, gm_always, gm_fullbuff){
    this.always = always ? true : false;
    this.gm_always = gm_always ? true : false;
    this.fullbuff = fullbuff ? true : false;
    this.gm_fullbuff = gm_fullbuff ? true : false;
};
function Spell(name, brief, mgroup, sclass, target, party, aAntogonist, aAlly, grSpell, aligns) { //brief, mgroup, sclass, buff, group, party, aAntogonist, aAlly, grSpell, aligns
    //buff: 0 - никогда, 1 - всегда, 2 - fullbuff, 3 - только при прокачке
    //group (кастовать на членов группы): 0-no, 1-yes, 2-full, 3-target
    //party (кастуется на всю группу)
    this.name = name;
    this.mbrief = brief; //буква из mudprompt
    this.mgroup = mgroup; //группа из mudprompt
    this.class = sclass; //внутреннее поголялово для класса заклинания
    this.target = target === undefined ? false : target; //кастуется ли на цель
    //this.buff = buff === undefined ? 0 : buff;
    //this.group = group === undefined ? 0 : group;
    this.party = party === undefined ? false : party; //кастуется на свою группу
    this.antogonist = aAntogonist==undefined ? [] : aAntogonist; //противоположности
    this.ally = aAlly==undefined ? [] : aAlly; //альтернативные
    this.aligns = aligns === undefined ? 'eng' : aligns; //ограничение по алигну
    this.progress = 0; // прокачка
    this.grSpell = grSpell; //спел, которым вешается несколько баффов в т.ч. и текущий
}
function AttackSpell(sName,sShort,sClass,lTarget,lRange,lArea,lFight,sDamage) {
    this.name = sName;
    this.short = sShort;
    this.class = sClass;
    this.target = lTarget ? true : false;
    this.range = lRange ? true : false;
    this.area = lArea ? true : false;
    this.fight = lFight ? true : false;
    this.damtype = sDamage; 
}

/************* Azazel Religion **************/
var lAzazel = false;
var azazel = new Azazel();
var AZAZEL_TIMER = 50;
var AZAZEL_WORDS_TIMER = 25;

function Azazel(heal_words, curse_words, attack_words) {
    if(heal_words!=undefined && curse_words!=undefined && attack_words!=undefined) {
        this.start=Date.now();
        this.is_set = true;
    } else {
        this.start=-1;
        this.is_set = false;
    }
    this.heal = new Words('heal',heal_words);
    this.curse = new Words('curse',curse_words);
    this.attack = new Words('attack',attack_words);

    this.stat = function() {
        if(!this.is_set) return '';

        return this.heal.get()+this.curse.get()+this.attack.get();
    };
};
function Words(name, str) {
    this.name = name ? name : undefined;
	this.words = str ? str : undefined;
    //когда использован:
	this.used = -1;
    this.use = function(){
        if(this.words==undefined) {
            echo('[AZAZEL ERROR: no words]');
            return;
        }
        send("say azazel "+this.words);
        echo('-->[Azazel '+this.name.toUpperCase()+']');
        this.used=Date.now();
    };
    this.get = function(){
        let sec_timer = 0;
        
        if(this.used != -1)
            sec_timer = AZAZEL_WORDS_TIMER*60 - Math.floor((Date.now()-this.used)/1000);
        
        if(sec_timer <= 0)
            this.used = -1;

        if(this.used > 0) {
            return '['+Math.floor((sec_timer)/60)+']';
        } else {
            return '[a'+this.name.substring(0,1)+']';
        }
    };
};
