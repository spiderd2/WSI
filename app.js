var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = {};

	
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'lamp.ii.us.edu.pl',
  user     : 'ii292231',
  password : 'Mac1234%',
  database : 'ii292231'
});

server.listen(3000);
app.use('/img', express.static(__dirname + '/img'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));

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
			else
			{
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
					else
					{
						callback(true);
						socket.nickname = data.nick;
						users[socket.nickname] = socket;	//users[maciek]=socket_id, do ktorego mozna sie odwolac
						updateNicknames();
					}
				 }
				 else
				 {						//niepoprawnie zalogowano
				 	callback(false);
				 }		 
		});
	});														//--------logowanie end
		
	//aktualizacja listy uzytkownikow
	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}

	//odbieranie wyslanej wiadomosci
	socket.on('send message', function(data, callback){
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
	
	//sprawdzanie bledow w konsoli
	socket.on('sprawdz', function(data){
		console.log(data);
	});
	//socket.on('doIndex1', function(data){
		//res.send('/index1.html');
	//});


	socket.on('zaproszenieDoGry', function(data){
		console.log('1...dostalem zaproszenie do gry dla '+data);
		users[data].emit('wyslijZaproszenieDoGracza', {msg:'uzytkownik '+socket.nickname+' prosi o gre', nickname:socket.nickname});
	});
	socket.on('przyjmujeGre', function(data){
		console.log('2...gracz mowi TAK');
	});
	socket.on('odrzucamGre', function(data){
		console.log('2...gracz mowi NIE');
	});
	
	//odbieranie zaproszenia wychodzacego od zapraszajacego
	socket.on('alert', function(data, callback){
		//var uzytkownik = data;
		console.log('1... odbieram alert ' + data);
		users[data].emit('wyswietl alert', 'uzytkownik: '+socket.nickname+' prosi o gre', function(msg){
			//wysylamy do drugiego gracza prosbe, zeby zwrocil true lub false
			if(msg)
			{
				console.log('4... odbieram informacje o OK');
				callback(true);
			}
			else
			{
				console.log('4... odbieram informacje ANULUJ');
				callback(false);
			}
		});
	});

	socket.on('wyslij plansze', function(data){	//data.gracz (nazwa) i data.plansza(tablica)

			console.log('7... plansze dla ' + data.gracz + ' i wklejam plansze '+ data.plansza);
			users[data.gracz].emit('pobierz plansze', data.plansza);
			socket.emit('test odbioru', "HOST, a moj przeciwnik to :"+data.gracz);
			socket.emit('wyslij nazwe przeciwnika', data.gracz);
			//socket.emit('zablokuj ruch');												
			users[data.gracz].emit('zablokuj ruch');									
			users[data.gracz].emit('test odbioru', "GUEST, a moj przeciwnik to: "+socket.nickname);
			users[data.gracz].emit('wyslij nazwe przeciwnika', socket.nickname);
			
	});
	socket.on('wykonano ruch', function(data){	//data.id_kafelki , data.gracz
			console.log("---SERVER: wykonal ruch. Wysylam info do "+data.gracz);
			users[data.gracz].emit('wyslij ruch',data.id_kafelki);
	});
	socket.on('zmiana tury', function(data){	//data - przeciwnik, ktory teraz zaczyna
			console.log("---SERVER odbiera informacje o przyznaniu tury przeciwnikowi "+data);
			users[data].emit('odblokuj ruch');
	});
	
	//aktualizacja listy graczy po disconnectie
	socket.on('disconnect', function(data){
		if(!socket.nickname) return;
		delete users[socket.nickname];
		updateNicknames();
	});
});
