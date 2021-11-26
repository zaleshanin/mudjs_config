/*TODO
- вынести список говорунов в переменную/массив [#говоруны]
- вынести #prompt и #battleprompt в chars, на случай если у чаров разный prompt
*/

/* Этот файл будет сохранен в браузере (в LocalStorage.settings).
 * В переменной mudprompt хранится много полезной информации о персонаже.
 * Подробнее см. https://github.com/dreamland-mud/mudjs/wiki/MUD-prompt
 * Расшифровка аффектов: https://github.com/dreamland-mud/mudjs/blob/dreamland/src/prompt.js
 */

var test = true; //true - для вывода всякой отладочной информации
var melt_counter = 0; //противодействие автовыкидыванию

var chars = {
    'Miyamoto': {
        name: 'Miyamoto',
        weapon: 'tempered',
        class: 'necromancer',
        clan: 'invader',
        water: 'spring',//'flask',
        food: 'mushroom',
    },
    'Zaleshanin': {
        name: 'Zaleshanin',
        weapon: 'long',
        class: 'thief',
        water: 'flask',
        food: 'rusk',
    }
};

var match;

var my_char = new Pchar();

var buffQueue = [];

/*--------------------------------------------------------------------------
 * Триггера - автоматические действия как реакция на какую-то строку в мире.
 *-------------------------------------------------------------------------*/
$('.trigger').on('text', function (e, text) {
    //[#prompt] + [#battleprompt] example: <1111/1111 2222/2222 333/333 [time][exits]>[0W0D]
    match = (/^<([0-9]{1,5})\/([0-9]{1,5}) ([0-9]{1,5})\/([0-9]{1,5}) ([0-9]{1,5})\/([0-9]{1,5}) \[(.*)]\[.*]>\[.*](\([0-9]{1,3}%:[0-9]{1,3}%\))?$/).exec(text);
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

    if (text.match('^Ты растворяешься в воздухе.$')) {
        if (++melt_counter % 10 === 0)
            send('who');
        else
            send('where');
        echo('[melt:' + melt_counter + ']');

    }

    buffPatterns.forEach(function (elem) {
        if (buffs[elem[0]] !== undefined) {
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

    buffPatterns.forEach(function (elem) {
        if (my_char.spells[elem[0]] !== undefined) {
            if (text.match(elem[1])) {
                if(test) {
                    echo("[buffPattert trigger]:"+elem[0]);
                }
                my_char.affChanged = true;
                buffQueue.push(new BuffQueue(elem[0], elem[2], elem[3], my_char.action));
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
        || text.match('^Твоя попытка закончилась неудачей.$')
        || text.match('На кого именно ты хочешь произнести заклинание')) {
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

    //[#food][#drink]
    if (text.match('^Ты умираешь от голода|^Ты умираешь от жажды')) {
        if (mudprompt.p2.pos === 'stand' || mudprompt.p2.pos === 'sit' || mudprompt.p2.pos === 'rest') {
            //        echo('>>> Правильно питаюсь, когда не сплю и не сражаюсь.\n');
            //        send('взять бочон сумка');
            //        send('пить боч|пить боч|пить боч');
            //        send('положить боч сумка');
        }
    }
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
        || text.match('^Жестяная фляга наполнена.$')
        || text.match('^Ты хочешь сделать тут озеро?')) {
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
        if(test) echo('-->"Ok." match!!!<--\n');
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
    //приказать всем
    command(e, 'ord(?:er)?', text, function (args) {
        args = args[1].toLowerCase().split(' ');

        echo('>>> Начинаем всем приказывать \n');
        if (test) {
            args.forEach(function (t, number) {
                //if (number > 0)
                echo(number + ':[' + t + '];\n');
            });
            echo('(total:' + args.length + ')\n');
        }
        if (args[0] === 'clear') {
            my_char.order = null;
            my_char.ordersChange = true;
        } else if (args[0] === 'all') {
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
        	checkBuff();
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
    send('scan ' + where);
}

// Рейнджеры могут стрелять по жертве victim из лука, а маги и клеры - 
// бить заклинаниями в соседнюю комнату.
function shoot(where) {
    //    send('стрелять ' + where + ' ' + victim); 
    //    send("к 'стен лезв' " + where + '.' + victim);
    //    send("к 'струя кисл' " + where + '.' + victim);
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
    KP_DIV = 111;

// Просто клавиша - идти по направлению, ctrl+клавиша - стрелять, alt+клавиша - всмотреться.
function dir(d, e) {
    if (e.ctrlKey) {
        shoot(d);
    } else if (e.altKey) {
        scan(d);
    } else {
        go(d);
    }
}

// Назначаем горячие клавиши и их действия.
keydown = function (e) {
    switch (e.which) {
        case KP_1:
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

        case 27: // escape
            if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
                $('#input input').val(''); // очистить поле воода
            } else {
                return;
            }
            break;

        /*
                case 192: // tilde.
                    // Пример автобаффа: проверяем какие аффекты отсутствуют и вешаем их.
                    if (mudprompt.enh === 'none' || mudprompt.enh.a.indexOf("l") == -1)
                        send("c learning");                    
                    if (mudprompt.enh === 'none' || mudprompt.enh.a.indexOf("g") == -1)
                        send("c giant");
                    if (mudprompt.enh === 'none' || mudprompt.enh.a.indexOf("f") == -1)
                        send("c frenzy");
                    if (mudprompt.enh === 'none' || mudprompt.enh.a.indexOf("h") == -1)
                        send("order rat c haste fiorine");  // Тут подставьте ваше имя.
                    if (mudprompt.pro === 'none' || mudprompt.pro.a.indexOf("p") == -1)
                        send("c 'prot shield'");
                    if (mudprompt.pro === 'none' || mudprompt.pro.a.indexOf("s") == -1)
                        send("c sanctuary");
                    // ... и так далее 
                    break;
        */

        /*
                case KP_0:
                    break;
                case KP_2:
                    break;        
                case KP_7:
                    break;
                case KP_MUL:
                    break;
                case KP_PLUS:
                    break;
                case KP_MINUS:
                    break;
                case KP_DOT:
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
    	my_char.ordersChange = false;
    	my_char.order = new Order();
	}

	doOrder();
}
function doOrder() {
    var vict_name;
	if (test) echo('->doOrder()');

    if(my_char.order.command!== undefined && mudprompt.group.npc!=undefined) {
        vict_name = mudprompt.group.npc[my_char.order.proced].sees;
        if(test) echo(' ->  (' + my_char.order.proced + ')' + vict_name +' -> ');

        if(my_char.order.name_num[vict_name]==undefined) {
            my_char.order.name_num[vict_name] = 1;
        } else {
            my_char.order.name_num[vict_name]++;
            vict_name = '' + my_char.order.name_num[vict_name] + '.' + vict_name;
        }
        vict_name="'"+vict_name+"'";
        if(test) echo(vict_name+"");

        if(my_char.action.act === undefined) {
            my_char.order.proced++;
            doAct('order',my_char.order.command,vict_name);
        }
        
    }
    if (test) echo('\n');

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

    if (!my_char.init) {
        charInit();
        if (test) echo('\n');
    }
    my_char.afk = afk;

    if (my_char.was_afk !== undefined && my_char.afk) {
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
        + (my_char.last_pose != undefined ? '[last:' + my_char.last_pose + ']' : '')
        + (my_char.was_afk != undefined ? '[was_afk]' : '')
        + (my_char.action.act != undefined ? '[act:' + my_char.action.act + ']' : '')
        + ' pos:' + mudprompt.p2.pos
        + (mudprompt.p2.posf != '' ? '; posf:' + mudprompt.p2.posf : '')
        + '\n');

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

    if (my_char.hunger + my_char.thirst > 0)
        echo(needsStatus);

    if (my_char.eqChanged)
        checkEquip();

    if (buffQueue.length)
    	changeBuffsStatus();
    if (my_char.affChanged)
    	checkBuff();

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
        let name = list[member].sees;
        let level = list[member].level;
        let i = 1;
        let new_name = i+"."+name;
        while(my_char.group.members[new_name]!=undefined) {
            new_name = ++i + "." + name;
        }
    
        my_char.group.members[new_name] = new GroupMember(name, new_name);
        //пишем спелы доступные чармису в my_char.group.spells
        //выборка кастуемых спелов в checkBuff()
        if(pets[name]!=undefined && pets[name].spells.length>0){
            for(let pet_spell of pets[name].spells){
                if(buffs[pet_spell]===undefined) 
                    continue;

                my_char.group.spells.push([new_name,pet_spell,level]);
            }
        }
    }
}
/*проверка скастованных бафов, выбор следующего бафа для каста */
function checkBuff() {
	if (test) echo('\n->chkBff()');
    var test_msg;
    
    //чар чем-то занят - прерываем
    if (my_char.action.act === undefined) {
        my_char.affChanged = false;
    } else {
        return;
    }
    //если пустой fullbuff.target - прерываем
/*     if(my_char.fullbuff.target==undefined) {
        if(test) echo("->FullBuff")
        return;
    }
 */        
    var havebuff = 0, activebuff = 0;
	var targ, caster, spell_to_cast;
	var lSkippSpell;
	var lDebuff = false;
    
    /*  собирается список всех спелов 
        в случае прокачки спелов - только спелы чара
        в остальных случаях спелы чаров могут быть заменены спелами чармиса с уровнем выше уровня чара */
    var oSpells = {}; 
    for(let spell of my_char.spells) {
        oSpells[spell]=new MemberSpell(my_char.name, my_char.level);
    }
    for(let aSpell of my_char.group.spells) {
        //пропускаем если прокачка спелов, а спел не обязательный (buff==1)
        if(my_char.pract && buffs[aSpell[1]].buff!=1) continue;

        
        if(oSpells[aSpell[1]]!=undefined) {
            //пропускаем если уже зареган спел большего уровня
            if(oSpells[aSpell[1]].level>=aSpell[2]) continue;

            //пропускаем если уже зареган, и бафается только на себя
            if(buffs[aSpell[1]].buff==0) continue;
        } 
            

        oSpells[aSpell[1]]=new MemberSpell(aSpell[0], aSpell[2]);
    }
    for(let spell_name in oSpells) {
        caster = oSpells[spell_name].member;
        spell_to_cast = spell_name;
        targ = undefined; 

        //lSkippSpell = false;
    	if (test) test_msg = '-->('+caster+':"' + spell_name + '" '+"["+buffs[spell_name].class+"]"+'"->' + my_char.fullbuff.target + ')';

        if (['combat', 'creation', 'maladictions'].indexOf(buffs[spell_name].class) >= 0 //не бафф
        	|| buffs[spell_name].progress === 1) { // если еще не практился
        	if (test) 
                echo(test_msg+'->(skip class:' + buffs[spell_name].class 
                + '|' + buffs[spell_name].progress + '%'
                + '|' + buffs[spell_name].level + ')');
        	continue;
    	}

        if(test) {
            test_msg += '[key:'+buffs[spell_name].mgroup+"-"+buffs[spell_name].mbrief+']';
        }

        //проверки если не фулбаф
        if(my_char.fullbuff.target===undefined) {
            //баф не обязательный - пропускаем
            if(buffs[spell_name].buff!=1) {
                echo(test_msg+'->(skip noFullBuff, unnecessary spell)');
                continue;
            }
            if(buffs[spell_name].group==0) {
                //бафф вешается только на себя
                if(test) echo("---->chk 4 single...");
                    
                //TODO дублированный код 1.2
                //висит на мне - пропускаем
                /* if(my_char.hasBuff(spell_name)) {
                    if(test) echo("---->skipped (have one)");
                    continue;
                } */

                if(buffs[spell_name].group==0) {
                    if(test) echo("---->chk 4 single...");
                    for_group_single:
                    for(let aGMspell of my_char.group.spells){
                        if(aGMspell[1]==spell_name) {
                            if(my_char.group.members[aGMspell[0]].buffs[spell_name]) {
                                if(test) echo("---->skipped for "+aGMspell[0]+"(have one)");
                                continue;
                            } else if(buffs[spell_name].ally!=undefined) {
                                for(let ally of buffs[spell_name].ally) {
                                    if(my_char.group.members[aGMspell[0]].buffs[ally]) {
                                        if(test) echo("---->skipped for "+aGMspell[0]+"(have ally:"+ally+")");
                                        continue for_group_single;
                                    }
                                }
                            }
                            //у кастера кончилась мана
                            if(my_char.group.members[caster] 
                                && my_char.fullbuff.empty.indexOf(my_char.group.members[caster].name)!=-1) {echo("---->caster "+aGMspell[0]+" empty mana!");continue;}
                            caster = aGMspell[0];
                            targ = aGMspell[0];
                            if(test) echo("-->caster & target changed: "+aGMspell[0]);
                        }                                 
                    }
                } else {
                    for_group:
                    for(let member_name in my_char.group.members) {
                        if(my_char.group.members[member_name].buffs[spell_name]) continue;

                        if (buffs[spell_name].ally !== undefined) { 
                            //если уже активен баф навешиваемый при применени текущего
                            for(let ally of buffs[spell_name].ally) {
                                if(my_char.group.members[member_name].buffs[ally]) {
                                    if(test) echo("---->skipped for "+member_name+"(have ally:"+ally+")");
                                    continue for_group;
                                }
                            }
                        }
                        //не подходит по алигну - пропускаем
                        if(my_char.group.members[member_name].align!==undefined
                            && buffs[spell_name].aligns.indexOf(my_char.group.members[member_name].align)==-1) {
                            //ищем аналоги:
                            if(buffs[spell_name].ally!=undefined) {
                                for(let ally of buffs[spell_name].ally) {
                                    if(my_char.group.members[member_name].align!==undefined
                                        && buffs[ally].aligns.indexOf(my_char.group.members[member_name].align)==-1){
                                        continue;
                                    }
                                    spell_to_cast = ally;
                                }
                            }
                            if(spell_to_cast==spell_name) {
                                if(test) echo("---->skipped for "+member_name+"(align:"+buffs[spell_name].align+":"+my_char.group.members[member_name].align+")");
                            
                                continue;
                            }
                            if(test) echo("---->spell changed: "+spell_to_cast);
                        }
                        //у кастера кончилась мана
                        if(my_char.group.members[caster] 
                            && my_char.fullbuff.empty.indexOf(my_char.group.members[caster].name)!=-1) {echo("---->caster "+aGMspell[0]+" empty mana!");continue;}

                        targ = member_name;
                        caster = member_name;
                        if(test) echo("---->target&caster changed: "+member_name);
                    }
                }
                if(targ==undefined) {
                    //висит на мне - пропускаем
                    if(caster==my_char.name){
                        if(my_char.hasBuff(spell_name)) {
                            if(test) echo("---->skipped (have one)");
                            continue;
                        }
                    } else {
                        if(my_char.group.members[caster].buffs[spell_name]) continue;
                    }
                    //у кастера кончилась мана
                    if(my_char.group.members[caster] 
                        && my_char.fullbuff.empty.indexOf(my_char.group.members[caster].name)!=-1) {echo("---->caster "+aGMspell[0]+" empty mana!");continue;}
                    

                    targ = caster;
                    if(test) echo("---->target changed: "+caster);
                }

                /* if(targ==undefined) {
                    targ = caster;
                    if(test) echo("---->target changed to caster: "+caster);
                } */
            } else {
                //бафф вешается на членов группы
                for_group:
                for(let member_name in my_char.group.members) {
                    //уже висит
                    if(my_char.group.members[member_name].buffs[spell_name]) continue;

                    if (buffs[spell_name].ally !== undefined) { 
                        //если уже активен баф навешиваемый при применени текущего
                        for(let ally of buffs[spell_name].ally) {
                            if(my_char.group.members[member_name].buffs[ally]) {
                                if(test) echo("---->skipped for "+member_name+"(have ally:"+ally+")");
                                continue for_group;
                            }
                        }
                    }
                    //не подходит по алигну - пропускаем
                    if(my_char.group.members[member_name].align!==undefined
                        && buffs[spell_name].aligns.indexOf(my_char.group.members[member_name].align)==-1) {
                        //ищем аналоги:
                        if(buffs[spell_name].ally!=undefined) {
                            for(let ally of buffs[spell_name].ally) {
                                if(my_char.group.members[member_name].align!==undefined
                                    && buffs[ally].aligns.indexOf(my_char.group.members[member_name].align)==-1){
                                    continue;
                                }
                                spell_to_cast = ally;
                            }
                        }
                        if(spell_to_cast==spell_name) {
                            if(test) echo("---->skipped for "+member_name+"(align:"+buffs[spell_name].align+":"+my_char.group.members[member_name].align+")");
                        
                            continue;
                        }
                        //у кастера кончилась мана
                        if(my_char.group.members[caster] 
                            && my_char.fullbuff.empty.indexOf(my_char.group.members[caster].name)!=-1) {echo("---->caster "+aGMspell[0]+" empty mana!");continue;}
                        
                        if(test) echo("---->spell changed: "+spell_to_cast);
                        caster = oSpells[spell_to_cast].member;
                        if(test) echo("---->caster changed: "+caster);
                    }

                    targ = member_name;
                    if(test) echo("---->target changed: "+member_name);
                }
            }
   
        } else
        //проверки фуллбафа:
        if(my_char.fullbuff.target!==undefined) {
            //не тот класс заклинания - пропускаем
            if(my_char.fullbuff.class!==undefined 
                && my_char.fullbuff.class!== buffs[spell_name].class) continue;

            if(test) echo(test_msg +'(class:ok)');
            if(my_char.fullbuff.target!='self') {
                if(test) echo("---->chk 4 target...");
    
                //уже скастовано - пропускаем
                if(my_char.fullbuff.buffs[spell_name]) {
                    if(test) echo("-->skipped (target have one)");
                    continue;
                }
    
                //не кастуется на цель - пропускаем
                if(buffs[spell_name].group==0) {
                    if(test) echo("---->skipped (not for target)");
                    continue;
                }
    
                //фулбаф на цель - меняем цель:
                targ = my_char.char.fullbuff.target;
                if(test) echo("---->target changed: "+targ);
            } else {
                if(my_char.fullbuff.all) {
                    if(test) echo("---->chk 4 fullbuff.all...");
    
                    if(buffs[spell_name].group==0) {
                        if(test) echo("---->chk not4group spell("+spell_name+")...");
                        for_group_single:
                        for(let aGMspell of my_char.group.spells){
                            if(aGMspell[1]==spell_name) {
                                if(my_char.group.members[aGMspell[0]].buffs[spell_name]) {
                                    if(test) echo("---->skipped for "+aGMspell[0]+"(have one)");
                                    continue;
                                } else if(buffs[spell_name].ally!=undefined) {
                                    for(let ally of buffs[spell_name].ally) {
                                        if(my_char.group.members[aGMspell[0]].buffs[ally]) {
                                            if(test) echo("---->skipped for "+aGMspell[0]+"(have ally:"+ally+")");
                                            continue for_group_single;
                                        }
                                    }
                                }
                                //у кастера кончилась мана
                                if(my_char.group.members[caster] 
                                    && my_char.fullbuff.empty.indexOf(my_char.group.members[caster].name)!=-1) {echo("---->caster "+aGMspell[0]+" empty mana!");continue;}

                                caster = aGMspell[0];
                                targ = aGMspell[0];
                                if(test) echo("-->caster & target changed: "+aGMspell[0]);
                            }                                 
                        }
                        if(targ==undefined) {
                            //висит на мне - пропускаем
                            if(caster==my_char.name){
                                if(my_char.hasBuff(spell_name)) {
                                    if(test) echo("---->skipped (have one)");
                                    continue;
                                }
                            } else {
                                if(my_char.group.members[caster].buffs[spell_name]) continue;
                            }
                            //у кастера кончилась мана
                            if(my_char.group.members[caster] 
                                && my_char.fullbuff.empty.indexOf(my_char.group.members[caster].name)!=-1) {echo("---->caster "+aGMspell[0]+" empty mana!");continue;}

                            targ = caster;
                            if(test) echo("---->target changed: "+caster);
                        }
                    } else {
                        if(test) echo("---->chk 4 group members...");
                        for_group:
                        for(let member_name in my_char.group.members) {
                            if(my_char.group.members[member_name].buffs[spell_name]) continue;
    
                            if (buffs[spell_name].ally !== undefined) { 
                                //если уже активен баф навешиваемый при применени текущего
                                for(let ally of buffs[spell_name].ally) {
                                    if(my_char.group.members[member_name].buffs[ally]) {
                                        if(test) echo("---->skipped for "+member_name+"(have ally:"+ally+")");
                                        continue for_group;
                                    }
                                }
                            }
                            //не подходит по алигну - пропускаем
                            if(my_char.group.members[member_name].align!==undefined
                                && buffs[spell_name].aligns.indexOf(my_char.group.members[member_name].align)==-1) {
                                //ищем аналоги:
                                if(buffs[spell_name].ally!=undefined) {
                                    for(let ally of buffs[spell_name].ally) {

                                        if(my_char.group.members[member_name].align!==undefined
                                            && buffs[ally].aligns.indexOf(my_char.group.members[member_name].align)==-1){
                                            continue;
                                        }
                                        if(oSpells[ally]==undefined) {
                                            continue;
                                        }
                                        //у кастера кончилась мана
                                        if(my_char.group.members[caster] 
                                            && my_char.fullbuff.empty.indexOf(my_char.group.members[caster].name)!=-1) {echo("---->caster "+aGMspell[0]+" empty mana!");continue;}

                                        spell_to_cast = ally;
                                        caster = oSpells[spell_to_cast].member;
                                    }
                                }
                                if(spell_to_cast==spell_name) {
                                    if(test) echo("---->skipped for "+member_name+"(align:"+buffs[spell_name].align+":"+my_char.group.members[member_name].align+")");
                                
                                    continue;
                                }
                                if(test) echo("---->spell changed: "+spell_to_cast);
                                if(test) echo("---->caster changed: "+caster);
                            }
    
                            targ = member_name;
                            if(test) echo("---->target changed: "+member_name);
                        }
                    }
                    if(targ==undefined) {
                        if(test) echo("---->chk 4 self...");
                        if(my_char.hasBuff(spell_name)) {
                            if(test) echo("---->skipped (have one)");
                            continue;
                        }
                        //на себя такое не вешаем
                        if(buffs[spell_to_cast].buff==0) {
                            if(test) echo("---->not buff for self fb (buff==0)");
                            continue;
                        }
                        targ = my_char.name;
                    }
                } else {
                    if(test) echo("---->chk 4 self fb...");
                    
                    //на себя такое не вешаем
                    if(buffs[spell_name].buff==0) {
                        if(test) echo("---->not buff for self fb (buff==0)");
                        continue;
                    }

                    //висит на мне - пропускаем
                    if(my_char.hasBuff(spell_name)) {
                        if(test) echo("---->skipped (have one)");
                        continue;
                    }

                    targ = my_char.name;
                }
            }
        }
        
        if(test) echo("---->spell:'"+spell_to_cast+"' caster:"+caster+" target:"+targ);
        
        if(caster==my_char.name) {
            if (mudprompt.p2.pos === "stand") {
                my_char.affChanged = true;
                doAct('cast', spell_to_cast, targ==my_char.name?'self':targ);
                return;
            } else {
                echo('надо чё-та кастануть!!!');
                my_char.affChanged = true;
                doAct('stand');
                return;
            }
        } else {
            my_char.affChanged = true;
            doAct('order', "cast '"+spell_to_cast+"'"+(caster==targ?'':" "+targ), caster);
            return;
        }
    
    }
    my_char.fullbuff = new Fullbuff();
    echo('[fullbuff done]');
    //if(test) {my_char.fullbuff = new Fullbuff();echo('[fullbuff done]');}
	/* if (test) 
        echo('\n(buffs:' + havebuff + ' activ:' + activebuff + ')\n'); */

	/* if (my_char.fullbuff.target && havebuff === activebuff) {
    	my_char.fullbuff = new Fullbuff();
    	echo('[fullbuff done]');
	} */
}//checkBuff()
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
	if (sBuff in buffs) {
    	if (test) echo('---->("' + sBuff + '" имеется в buffs)');

    	if (buffs[sBuff].ally !== undefined) {
        	if (test) echo('---->(есть ally)');
        	buffs[sBuff].ally.forEach(function (spell) {
            	if (spell === action.command && buffs[spell].group)
                	if (test) echo('---->(ally4group ' + spell + ')');
            	lGroupAlly = true;
        	});
    	}
    	if (buffs[sBuff].group || lGroupAlly) {
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
    	if (!lStatus && buffs[sBuff].party) {
        	if (test) echo('---->(remove from group)');
        	forGroup = true;
    	}

    	if (sBuff !== action.command && buffs[sBuff].antogonist !== undefined) {
        	buffs[sBuff].antogonist.forEach(function (spell) {
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
    	if (test) echo('---->(forSelf(check only):' + sBuff + ' self ' + lStatus + ')->result:'+my_char.hasBuff(sBuff));
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
    if (my_char.hunger + my_char.thirst == 0) {
        my_char.needsChanged = false;
        return;
    }
    if (my_char.action.act !== undefined) {
        return;
    }

    if ((my_char.hunger <= 1 && my_char.thirst <= 1)
        && !(my_char.pract && (my_char.hunger || my_char.thirst))) {
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
        if (!my_char.lwater) {
            if (my_char.water === 'spring') {
                if (checkPose('stand')) {
                    my_char.needsChanged = true;
                    doAct('cast', 'create spring');
                    return;
                }
                if (my_char.water === 'flask') {
                    if (test) echo('->(water === flask)');
                    if (test) echo('-->(create water=' + my_char.spells['create water'] + ')');
                    if (my_char.spells['create water'] !== undefined) {
                        if (test) echo('->(create water !== undefined)');
                        if (checkPose('stand')) {
                            my_char.needsChanged = true;
                            doAct('cast', 'create water', my_char.water);
                            return;
                        }
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
    if (my_char.action.act !== undefined) {
        if (test) echo('[' + my_char.action.act + '->EXIT]');
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
    if(test) echo(' -->GroupMember('+index_name+')');
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
    this.level = member_level;
    this.member = member_name;
}

function Pchar(name, char, level) {
    if (test)
        echo(' -->Pchar() (name:' + name + ';weapon:' + (char===undefined?undefined:char.weapon) + ')');

    this.init = name===undefined ? false : true; 
    this.afk = false;

    this.pract = false; //признак состояния прокачки скилов
    this.last_pose = undefined;
    this.was_afk = undefined;

    this.name = name===undefined ? undefined : name;
    this.level = level===undefined ? undefined : level;

    this.weapon = char===undefined ? undefined : char.weapon;
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
        if((mudprompt[buffs[cast].mgroup]!==undefined && mudprompt[buffs[cast].mgroup]!=='none') && mudprompt[buffs[cast].mgroup].a.indexOf(buffs[cast].mbrief)!==-1){
            if(test) echo("------>hasBuff("+cast+")->have one!")
            return true;
        }
        
        if(buffs[cast].ally!=undefined) {
            for(let ally of buffs[cast].ally) {
                if((mudprompt[buffs[ally].mgroup]!==undefined && mudprompt[buffs[ally].mgroup]!=='none') && mudprompt[buffs[ally].mgroup].a.indexOf(buffs[ally].mbrief)!==-1){
                    if(test) echo("------>hasBuff("+cast+")->have ally("+ally+")!")
                    return true;
                }
            }
        }
    };
    this.fullbuff = new Fullbuff();

	this.order = new Order();

    this.group = new Group();
}

function Fullbuff(bclass, btarget, all) {
	echo('->Fullbuff('+bclass+','+btarget+','+all+')');
	this.class = bclass === undefined ? undefined : bclass;
	this.target = btarget === undefined ? undefined : btarget;
	this.all = all === undefined ? false : all;
	this.buffs = {};
    this.empty = [];
    this.away = [];
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
    }
    if (char!==undefined && char.class === 'necromancer') {
        spells.push(['shield',12]);
        spells.push(['protective shield',18]);
        spells.push(['armor',20]);
        spells.push(['dark shroud',21]);
        spells.push(['stone skin',30]);
        spells.push(['protection good',17]);
        spells.push(['spell resistance',69]);
/*
        this['learning'] = new Spell('LRN', 33, 'protective', 1);
        this['magic missile'] = new Spell('mm', 2, 'combat');
        this['chill touch'] = new Spell('ChT', 7, 'combat');
        this['create water'] = new Spell('CrW', 11, 'creation');
        this['create food'] = new Spell('CrF', 12, 'creation');
        this['detect good'] = new Spell('DtG', 13, 'detection', 3);
        this['detect undead'] = new Spell('DtU', 13, 'detection', 3);
        this['detect invis'] = new Spell('DtI', 13, 'detection', 1);
        this['burning hands'] = new Spell('BnH', 14, 'combat');
        this['protection negative'] = new Spell('PrN', 13, 'protective', 2);
        this['poison'] = new Spell('PSN', 23, 'maladictions');
        this['lightning bolt'] = new Spell('LiB', 23, 'combat');
        this['fly'] = new Spell('FLY', 23, 'protective', 1);
        this['dispel affects'] = new Spell('DAf', 24, 'maladictions');
        this['cancellation'] = new Spell('CNL', 28, 'maladictions');
        this['giant strength'] = new Spell('GSt', 28, 'protective', 2, 2);
        this['sonic resonance'] = new Spell('SoR', 28, 'combat');
        this['magic concentrate'] = new Spell('MCt', 60, 'protective', 2);
        this['create spring'] = new Spell('CrS', 31, 'creation');
 */    
    }
    for(let aSpell of spells) {
        
        if(test) echo("Spells: "+aSpell[0]+":"+aSpell[1]+"("+char.name+":"+level+")");

        if(buffs[aSpell[0]]!==undefined && aSpell[1] <= level)
            result.push(aSpell[0]);
        
    }
    return result;
}
function Spell(brief, mgroup, sclass, buff, group, party, aAntogonist, aAlly, aligns) {
    //buff: 0 - никогда, 1 - всегда, 2 - fullbuff, 3 - только при прокачке
    //group (кастовать на членов группы): 0-no, 1-yes, 2-full, 3-target
    //party (кастуется на всю группу)
    this.mbrief = brief;
    this.mgroup = mgroup;
    this.class = sclass;
    this.buff = buff === undefined ? 0 : buff;
    this.group = group === undefined ? 0 : group;
    this.party = party === undefined ? false : party;
    this.antogonist = aAntogonist;
    this.ally = aAlly;
    this.aligns = aligns === undefined ? 'eng' : aligns;
    this.progress = 0;
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
    //['armor', '^Волшебная броня окружает .*.$', true, true],
	['armor', '^.* окружает магическая броня, улучшающая защитные навыки.$', true, true],
	//['armor', '^.* уже защищен(а)? заклинанием брони.$', true, true],
	['armor', '^.* уже под воздействием этого заклинания брони.$', true, true],
    ['shield', '^Щит, окружавший тебя, исчезает.$', false, false],
	['shield', '^Божественная энергия окружает .* щитом.$', true, true],
	//['shield', '^Волшебный щит окружает .*.$', true, true],
    ['shield', '^.* окружает магический щит, помогающий блокировать удары.$', true, true],
	//['shield', '^.* уже защищен(а)? заклинанием щита.$', true, true],
	['shield', '^.* уже под воздействием этого заклинания.$', true, true],
	['enhanced armor', '^Силовое поле, защищавшее тебя, исчезает.$', false, false],
	//['enhanced armor', '^Силовая защита окружает .*.$', true, true],
    ['enhanced armor', '^Тебя окружает силовое поле, помогающее уходить от ударов.*.$', true, true],
//	['enhanced armor', '^Силовое поле уже защищает тебя.$', true, true],
	['enhanced armor', 'Ты уже под защитой силового поля.$', true, true],
	['enhanced armor', '^Силовое поле уже окружает .*.$', true, true],
	['bless', '^Ты больше не чувствуешь божественного благословления.$', false, false],
	['bless', '^Ты больше не чувствуешь божественного благословения.$', false, false],
	['bless', '^Ты чувствуешь божественное благословение.$', true, true],
	['bless', '^.* уже благословлен.', true, true],
	['bless', '^Ты даришь .* благословение своих богов.', true, true],
	['sanctuary', '^Белая аура вокруг тебя исчезает.$', false, false],
	['sanctuary', '^Белая аура окружает .*.$', true, true],
	['sanctuary', '^.* уже под защитой святилища.', true, true],
	['sanctuary', 'Аура святилища уже защищает тебя.$', true, true],
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
	//['stone skin', '^Твоя кожа становится тверже камня.$', true, true],
    ['stone skin', '^Твоя кожа становится серой, превращаясь в камень.$', true, true],
    ['stone skin', '^Кожа .* становится серой, превращаясь в камень.$', true, true],
	['stone skin', 'Твоя кожа уже тверда как камень.$', true, true],
	['dragon skin', '^Твоя кожа становится мягче.$', false, false],
	['dragon skin', '^Твоя кожа уже тверда, как драконья.$', true, true],
	['dragon skin', '^Твоя кожа становится тверже драконьей.$', true, true],
	['protective shield', '^Охранный щит вокруг тебя исчезает.$', false, false],
	//['protective shield', '^Охранный щит окружает тебя.$', true, true],
    ['protective shield', '^.* окружает тускло светящийся охранный щит, отклоняющий резкие толчки и удары.$', true, true],
	['protective shield', '^Охранный щит уже окружает тебя.$', true, true],
	['protective shield', 'Ты уже под воздействием охранного щита.$', true, true],
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
    //['haste', '^Твои движения становятся намного быстрее.$', true, true],
	['haste', '^Твои движения и метаболизм ускоряются!$', true, true],
    //['haste', '^Ты не можешь двигаться быстрее, чем сейчас!$', true, true],
    ['haste', 'Ты уже мечешься вокруг как ежик Соник.$', true, true],
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
	//['spell resistance', '^Ты уже имеешь эту защиту.', true, true],
    ['spell resistance', 'Ты уже устойчива к заклинаниям.$', true, true],
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
    ['dark shroud', '^Темная аура защитит только злых персонажей.$', true, true],
	['protection negative', '^Ты беззащитен перед своими атаками.$', false, false],
	['protection negative', '^Ты приобретаешь иммунитет к негативным атакам.$', true, true],
	['protection negative', '^У тебя уже есть иммунитет к негативным атакам.', true, true],
	['shadow cloak', '^Призрачная мантия, окутывавшая тебя, тает.$', false, false],
	['shadow cloak', '^Жажда чужих душ стихает внутри тебя.$', false, false],
	//['shadow cloak', '^Призрачная мантия окутывает тебя.$', true, true],
    ['shadow cloak', '^Призрачная мантия окутывает тебя. Ты погружаешься во тьму.$', true, true],
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
    },
    'ночная тен' :{
        'spells' : ['armor', 'assist', 'create food', 'create spring', 'dark shroud', 'detect invis', 'fly', 'giant strength', 'improved detect', 'infravision', 'invisibility', 'knock', 'learning', 'link', 'pass door', 'protection cold', 'protection good', 'protection negative', 'protective shield', 'refresh', 'shield', 'spell resistance', 'stone skin'],
        'align' : 'e',
    },
    'призванная' :{
        'spells' : ['armor', 'assist', 'create food', 'create spring', 'detect invis', 'fly', 'giant strength', 'improved detect', 'infravision', 'invisibility', 'knock', 'learning', 'link', 'pass door', 'protection cold', 'protection negative', 'protective shield', 'refresh', 'shield', 'spell resistance', 'stone skin'],
        'align' : 'n',
    },
};

var buffs = {
    //Spell(brief, mgroup, level, sclass, buff, group, party, aAntogonist, aAlly, alligns)
    'rainbow shield': new Spell('R', 'pro','protective'),

    //invader:
    'shadow cloak': new Spell('S', 'cln', 'protective', 2),

    //protect:
    //necr
    'shield':  new Spell('S', 'pro', 'protective', 2, 3),
    'protective shield': new Spell('p', 'pro', 'protective', 2),
    'armor': new Spell('a', 'pro', 'protective', 2, 3),
    'dark shroud': new Spell('d', 'pro', 'protective', 2, 2,false,[],['stardust','sanctuary'],'e'),
    'stone skin': new Spell('k', 'pro', 'protective', 2),
    'protection good': new Spell('g', 'pro', 'protective', 2),
    'spell resistance': new Spell('m', 'pro', 'protective', 2, 0, false,[],['rainbow shield']),
    //pets:
    'stardust': new Spell('z', 'pro', 'protective', 2, 2,false,[],['dark shroud','sanctuary']),
    'sanctuary': new Spell('s', 'pro', 'protective', 2, 2,false,[],['dark shroud','stardust']),
    'enhanced armor': new Spell('A', 'pro', 'protective', 2, 2),
    'haste': new Spell('h', 'enh', 'protective', 0, 2),
};
