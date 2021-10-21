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

var match;

var my_char = { init: false };

var chars = {
    Miyamoto: {
        weapon: 'tempered',
        class: 'necromancer',
        clan: 'invader',
        water: 'spring',//'flask',
        food: 'mushroom'
    },
    Zaleshanin: {
        weapon: 'long',
        class: 'thief',
        water: 'flask',//'flask',
        food: 'rusk'
    }
};

/*--------------------------------------------------------------------------
 * Триггера - автоматические действия как реакция на какую-то строку в мире.
 *-------------------------------------------------------------------------*/
$('.trigger').on('text', function (e, text) {
    //[#prompt] + [#battleprompt] example: <1111/1111 2222/2222 333/333 [time][exits]>[0W0D]
    match = (/^<([0-9]{1,5})\/([0-9]{1,5}) ([0-9]{1,5})\/([0-9]{1,5}) ([0-9]{1,5})\/([0-9]{1,5}) \[(.*)]\[.*]>\[.*](\([0-9]{1,3}%:[0-9]{1,3}%\))?$/).exec(text);
    if (match) {
        promptRecived(false);
    }
    match = (/^<AFK>[\s]?$/).exec(text);
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

    if (text.match('^Ok\.$')) {
        if(test) echo('-->"Ok." match!!!<--\n');
        if (my_char.action.act !== undefined) {
            if (my_char.action.act==='order') {
                clearAction();
            }
        }
    }

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

<<<<<<< HEAD
=======
    if (text.match('^Ты не можешь сконцентрироваться.$')
        || text.match('^Твоя попытка закончилась неудачей.$')) {
        clearAction();
    }

>>>>>>> 18b286ad208d99672ab008ac2c221864eb8f9951
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
        || text.match('^Ты взмахиваешь руками и создаешь магический гриб.$')
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
    if (text.match(' родник пробивается сквозь землю.$')
<<<<<<< HEAD
        || text.match('^Жестяная фляга наполнена.$')) {
=======
        || text.match('^Жестяная фляга наполнена.$')
        || text.match('^Ты хочешь сделать тут озеро?')) {
        if (test) echo("[water creation trigger]");
>>>>>>> 18b286ad208d99672ab008ac2c221864eb8f9951
        my_char.lwater = 1;
        if (my_char.action.command == 'create spring' || my_char.action.command == 'create water')
            clearAction();
    }
<<<<<<< HEAD
    if (text.match('^Ты пьешь воду из')) {
=======
    if (text.match('^Ты пьешь [^\s]* из ')) {
>>>>>>> 18b286ad208d99672ab008ac2c221864eb8f9951
        if (my_char.action.act == 'drink')
            clearAction();
    }
    if (text.match('^Ты больше не чувствуешь жажды.$')) {
        my_char.thirst = 0;
        my_char.lwater = false;
        my_char.needsChanged = true;
    }

    //[#else]


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
        if (args[0] === 'all') {
            my_char.order = new Order(args.join(' ').replace(args[0] + ' ', ''));
            if (test) echo('-->' + my_char.order.command);
            my_char.ordersChange = true;
            doOrder();
            //order all stand
            //order rat c fren
            //order rat c fren char
            //order rat c fren all
            //order rat c fren 2.stone
        } else {
            send(text);
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

    let charname = getCharName();

    if (test) echo(' -->charname=' + charname);

    if (chars[charname] !== undefined)
        my_char = new Pchar(charname, chars[charname]);
    else {
        if (test) echo(' -->chars[' + charname + '] == undefined');
    }
}

function getCharName() {
    let result = '';
    if (isEqualChar(mudprompt.group.leader))
        return mudprompt.group.ln;

    for (var i in mudprompt.group.pc) {
        if (isEqualChar(mudprompt.group.pc[i])) {
            return mudprompt.group.pc[i].sees;
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

    if(my_char.order.command!== undefined) {
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
    if (test) echo('-->doAct(' + act + ', ' + comm + ', ' + tag + ')');
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

    if (my_char.hunger + my_char.thirst > 0)
        echo(needsStatus);

    if (my_char.eqChanged)
        checkEquip();

    if (my_char.needsChanged)
        checkNeeds();

    if(my_char.ordersChange)
    	checkOrders();

    if (!my_char.needsChanged && !my_char.eqChanged
    && (my_char.last_pose != undefined || my_char.was_afk != undefined))
        restoreStatus();
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

function checkNeeds() {
	if (test) echo('->checkNeeds(mode: pose:' + mudprompt.p2.pos + ' w:' + my_char.lwater + ' f:' + my_char.lfood + ')');
	if (my_char.action.act === undefined)
    	my_char.needsChanged = false;

    if((my_char.hunger <= 1 && my_char.thirst <=1) 
        && !(my_char.pract && (my_char.hunger || my_char.thirst))) {
            return;
    }

    if(['fight', 'stun', 'incap', 'mort', 'dead'].indexOf(mudprompt.p2.pos) !== -1) {
        return;
    }

    if(my_char.afk) {
        changeAFK();
        my_char.needsChanged = true;
        return;
    }

    //[#food]
    if(my_char.hunger) {
        if(!my_char.lfood) {
            if (my_char.food == 'manna' || my_char.food == 'mushroom') {
                if(checkPose('stand')) {
                    my_char.needsChanged = true;
                    doAct('cast', 'create food');
                    return;    
                }
            }
            if (my_char.food === 'rusk') {
                if(checkPose('rest')){
                    my_char.needsChanged = true;
                    doAct('get rusk pack');
                    return;
                }
            }
        } else {
            if(checkPose('rest')){
                my_char.needsChanged = true;
                doAct('eat', my_char.food);
                return;
            }
        }
    }
    //[#drink]
   	if (pchar.thirst) {
        if (!pchar.lwater) {
            if (pchar.water === 'spring') {
                if(checkPose('stand')) {
                    my_char.needsChanged = true;
                    doAct('cast', 'create spring');
                    return;    
                }
                if (pchar.water === 'flask') {
                    if (test) echo('->(water === flask)');
                  	if (test) echo('-->(create water=' + my_char.spells['create water'] + ')');
                    if (pchar.spells['create water'] !== undefined) {
                        if (test) echo('->(create water !== undefined)');
                        if(checkPose('stand')) {
                            pchar.needsChanged = true;
                            doAct('cast', 'create water', pchar.water);
                            return;
                        }
                    }
                    	
                } else {
                    if(checkPose('stand')) {
                        pchar.needsChanged = true;
                        doAct('drink', pchar.water)
                        return;
                    }
                 }
            	
        	}
    	}
	}
}
function checkPose(need_pose) {
    if(test) echo('->checkPose('+need_pose+')');
    if(need_pose==mudprompt.p2.pos) 
        return true;
    
    if(need_pose=='rest' && mudprompt.p2.pos!=='sleep') 
        return true;

    my_char.last_pose = mudprompt.p2.pos;
    doAct(need_pose);
    return false;
}
function changeAFK(){
    my_char.was_afk = my_char.afk ? true : false;
    doAct('afk');
}

//[#Конструкторы]
function Action(act, command, target) {
    this.act = act; //spelling, wearing, drinking, eating, getting, slooking
    this.command = command;
    this.target = target;
}

function Pchar(name, char) {
    if (test)
        echo(' -->Pchar() (name:' + name + ';weapon:' + char.weapon + ')');

    this.init = true;
    this.afk = false;

    this.pract = false;
    this.last_pose = undefined;
    this.was_afk = undefined;

    this.name = name;

    this.weapon = char.weapon;
    //[#armed] 0 - без оружия(оружие на земле), 1 - оружие в мешке, 2 - вооружен
    this.armed = false;

    this.food = char.food;
    this.water = char.water;
    this.thirst = 0;
<<<<<<< HEAD
	this.hunger = 0;
	this.lfood = false;
	this.lwater = false;
=======
    this.hunger = 0;
    this.lfood = false;
    this.lwater = false;
>>>>>>> 18b286ad208d99672ab008ac2c221864eb8f9951

    //[#action] act - команда к выполеннию (н-р: \\get, \\wield, cast)
    //          command - 'acid blast' | target 
    //          target - цель
    this.action = {
        act: undefined,
        command: undefined,
        target: undefined
    };

    this.ordersChange = false;

    this.spells = new Spells(char);
	this.order = new Order();
}

function Order(comm) {
	this.command = comm===undefined ? undefined : comm;
	this.proced = comm===undefined ? undefined : 0;
    this.name_num = [];
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
        this['fly'] = new Spell('FLY', 23, 'protective', 1);
        this['dispel affects'] = new Spell('DAf', 24, 'maladictions');
        this['cancellation'] = new Spell('CNL', 28, 'maladictions');
        this['giant strength'] = new Spell('GSt', 28, 'protective', 2, 2);
        this['sonic resonance'] = new Spell('SoR', 28, 'combat');
        this['stone skin'] = new Spell('StS', 30, 'protective', 2);
        this['dark shroud'] = new Spell('DSh', 21, 'protective', 2, 2);
        this['magic concentrate'] = new Spell('MCt', 60, 'protective', 2);
        this['create spring'] = new Spell('CrS', 31, 'creation');
    }
    if (char.clan === 'invader') {
        this['shadow cloak'] = new Spell('ShC', 10, 'protective', 2);
    }
}

function Spell(brief, level, sclass, buff, group, party, aAntogonist, aAlly) {
    //buff: 0 - никогда, 1 - всегда, 2 - fullbuff, 3 - только при прокачке
    //group (кастовать на членов группы): 0-no, 1-yes, 2-full, 3-target
    //party (кастуется на всю группу)
    this.brief = brief;
    this.level = level;
    this.class = sclass;
    this.buff = buff === undefined ? 0 : buff;
    this.group = group === undefined ? 0 : group;
    this.party = party === undefined ? false : party;
    this.antogonist = aAntogonist;
    this.ally = aAlly;
    this.progress = 0;
}

