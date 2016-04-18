var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = {},
	usersInGame={};

	
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'lamp.ii.us.edu.pl',
  user     : 'ii292231',
  password : 'Mac1234%',
  database : 'ii292231'
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
app.set('port', (process.env.PORT || 3000));
app.use('/img', express.static(__dirname + '/img'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
//app.use('/', express.static(__dirname + '/'));

app.get('/', function(req, res){
	res.sendfile(__dirname + '/index.html');
});

//rejestracja
io.sockets.on('connection', function(socket){
	
	socket.on('rejestracja', function(data, callback){		//---------rejestracja - data.nick i data.pass ; callback true jezeli mozna zarejestrowac	 
		var q ="INSERT INTO `ii292231`.`uzytkownicy` (`ID`, `nick`, `pass_hash`, `wygrane`, `przegrane`, `remis`) VALUES (NULL, '"+ data.nick+"', MD5('"+data.pass+"'), '0', '0', '0');"
 		connection.query(q, function (qe, qr) {		
    		if (qe) { 
				console.log("------------ERROR-------------");
				console.log(qe); 
				callback(false);
			}
			else{
				callback(true);
			}
		});	
	});														//--------rejestracja end
	
	socket.on('logowanie', function(data, callback){		//--------logowanie data.nick i data.pass, callback true jezeli mozna zalogowac	
		var queryString = 'SELECT COUNT(1) AS cnt FROM uzytkownicy WHERE nick like \''+data.nick+'\' AND pass_hash like MD5(\''+data.pass+'\')'; 
		connection.query(queryString, function (err, rows, fields) {
    			if (err) { 
					console.log(err);
				}
				if((rows[0].cnt)==1){		//poprawnie zalogowano
				 	if (data.nick in users){
						callback(false);	//jezeli jest juz zalogowany(np na innej karcie)
					} 
					else{
						callback(true);
						socket.nickname = data.nick;
						users[socket.nickname] = socket;	//users[maciek]=socket_id, do ktorego mozna sie odwolac
						updateNicknames();
					}
				 }
				 else{						//niepoprawnie zalogowano
				 	callback(false);
				 }		 
		});
	});														//--------logowanie end
		
	socket.on('send message', function(data, callback){//odbieranie wyslanej wiadomosci
		var msg = data.trim();
		console.log('after trimming message is: ' + msg);
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if(name in users){
					users[name].emit('whisper', {msg: msg, nick: socket.nickname});
					console.log('message sent is: ' + msg);
					console.log('Whisper!');
				}else{
					callback('Error!  Enter a valid user.');
				}
			}else{
				callback('Error!  Please enter a message for your whisper.');
			}
		}else{
			io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
		}
	});
	
	socket.on('sprawdz', function(data){ //sprawdzanie bledow w konsoli
		console.log(data);
	});
	

	socket.on('alert', function(data, callback){	//odbieranie zaproszenia wychodzacego od zapraszajacego
		//socket.przeciwnik =data;																			//...............to gdzie indziej daj
		console.log('1... odbieram alert ' + data);
		users[data].emit('wyswietl alert', 'uzytkownik: '+socket.nickname+' prosi o gre', function(msg){
			//wysylamy do drugiego gracza prosbe, zeby zwrocil true lub false
			if(msg){
				console.log('4... odbieram informacje o OK');
				callback(true);
			}
			else{
				console.log('4... odbieram informacje ANULUJ');
				callback(false);
			}
		});
	});
	
	socket.on('wyslij plansze', function(data){	//data.gracz (nazwa) i data.plansza(tablica)
		console.log('7... plansze dla ' + data.gracz + ' i wklejam plansze '+ data.plansza);
		users[data.gracz].emit('pobierz plansze', data.plansza);
		//socket.emit('test odbioru', "HOST, a moj przeciwnik to :"+data.gracz);
		socket.emit('wyslij nazwe przeciwnika', data.gracz);
		//socket.emit('zablokuj ruch');												
		users[data.gracz].emit('zablokuj ruch');									
		//users[data.gracz].emit('test odbioru', "GUEST, a moj przeciwnik to: "+socket.nickname);
		users[data.gracz].emit('wyslij nazwe przeciwnika', socket.nickname);
			
	});
	socket.on('wykonano ruch', function(data){	//data.id_kafelki , data.gracz
		console.log("---SERVER: wykonal ruch. Wysylam info do "+data.gracz);
		users[data.gracz].emit('wyslij ruch',data.id_kafelki);
	});
	
	socket.on('zmiana tury', function(data){	//data.przeciwnik 
		console.log("---SERVER odbiera informacje o przyznaniu tury przeciwnikowi "+data);
		users[data.przeciwnik].emit('odblokuj ruch');
	});
	
	socket.on('wyslij punkty', function(data){ 	//data.punkty data.przeciwnik
			users[data.przeciwnik].emit('wyslij punkty przeciwnika', data.punkty)	
	});
	
	socket.on('jestem w grze', function(){
			usersInGame[socket.nickname]=true;
			updateNicknames();
	});
	socket.on('nie jestem w grze', function(){
			console.log("---otrzymuje powiadomienie, ze gracz "+socket.nickname+" nie gra");
			if(!socket.nickname) return;
			delete usersInGame[socket.nickname];
			updateNicknames();
	});
	
	socket.on('nazwa przeciwnika',function(data){
			socket.przeciwnik=data;
	});
	socket.on('poddaje sie',function(){
		if(!socket.nickname) return;
		console.log('--------poddal sie: '+socket.nickname);
		 //sprawdz czy gracz gra
		console.log('--------przeciwnikiem poddajacego sie byl: '+socket.przeciwnik);
		users[socket.przeciwnik].emit('przeciwnik sie poddal');	
		if(usersInGame.hasOwnProperty(socket.nickname)){
			delete usersInGame[socket.nickname];		//i usun go z listy grajacych
			updateNicknames();
		}
		if(usersInGame.hasOwnProperty(socket.przeciwnik)){
			delete usersInGame[socket.przeciwnik];	
			updateNicknames();
		}
		
	});
	
	socket.on('disconnect', function(data){		//aktualizacja listy graczy po disconnectie						
		if(!socket.nickname) return;
		if(usersInGame.hasOwnProperty(socket.nickname)){ //sprawdz czy gracz gra
			console.log('--------przeciwnikiem uciekajacego byl: '+socket.przeciwnik);
			users[socket.przeciwnik].emit('przeciwnik zrobil disconnect');
			
			var q = "UPDATE uzytkownicy SET przegrane = przegrane + 1 WHERE nick like \'"+socket.nickname+"\'";
 			connection.query(q, function (qe, qr) {		
    			if (qe) { 
					console.log("------------ERROR-------------");
					console.log(qe); 	
				}
				else{
					console.log("---------pomyslnie zapisano przegrana");	
				}	
			});
			delete usersInGame[socket.nickname];		//i usun go z listy grajacych
			if(usersInGame.hasOwnProperty(socket.przeciwnik)){
				delete usersInGame[socket.przeciwnik];		//grajacego tez usun z listy grajacych
			}
			console.log('--------znalazlem grajacego ktory zrobil DC');		
		}
		console.log('--------uzytkownik '+socket.nickname+' DISCONNECTED');
		delete users[socket.nickname];
		updateNicknames();
	});
	
	function updateNicknames(){			//aktualizacja listy uzytkownikow
		console.log("-----aktualizuje liste grajacych");
		io.sockets.emit('usernames', {users: Object.keys(users), usersingame: Object.keys(usersInGame)});
	}
	
	socket.on('wygrana', function(){
		var q = "UPDATE uzytkownicy SET wygrane = wygrane + 1 WHERE nick like \'"+socket.nickname+"\'";
 		connection.query(q, function (qe, qr) {		
    		if (qe) { 
				console.log("------------ERROR-------------");
				console.log(qe); 	
			}
			else{
			console.log("---------pomyslnie zapisano wygrana");	
			}
		});	
	});
	socket.on('przegrana', function(){
		var q = "UPDATE uzytkownicy SET przegrane = przegrane + 1 WHERE nick like \'"+socket.nickname+"\'";
 		connection.query(q, function (qe, qr) {		
    		if (qe) { 
				console.log("------------ERROR-------------");
				console.log(qe); 	
			}
			else{
			console.log("---------pomyslnie zapisano przegrana");	
			}
		});	
	});
	socket.on('remis', function(){
		var q = "UPDATE uzytkownicy SET remis = remis + 1 WHERE nick like \'"+socket.nickname+"\'";
 		connection.query(q, function (qe, qr) {		
    		if (qe) { 
				console.log("------------ERROR-------------");
				console.log(qe); 	
			}
			else{
			console.log("---------pomyslnie zapisano remis");	
			}
		});	
	});
	
	socket.on('przeslij mi ranking', function(){
			connection.query("SELECT nick, wygrane, przegrane, remis FROM `uzytkownicy` ORDER BY `uzytkownicy`.`wygrane`-`uzytkownicy`.`przegrane` DESC LIMIT 0 , 100", function(err, rows, fields) {		 		
				if (err) { throw err; }
				socket.emit('wyslij dane rankingowe', rows);
  
			});		
	});	
});
