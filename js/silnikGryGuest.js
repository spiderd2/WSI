

function newBoardGuest(memory_array_gotowe) {
    memory_values = [];
    memory_tile_ids = [];
    tiles_flipped = 0;
    tiles_flips = 0;
    moves = 0;
    memory_array = memory_array_gotowe;
    columns=6;
    rows=6;
    how_many_tiles = rows * columns;
	memory_values = [];
	//czyja_kolej=0;
	kliknietaKafelka='';
	twojRuch=true;
	punkty=0;
	punktyprzeciwnika=0;
	aktualnieWGrze=true;
    tiles_flipped = 0;
    output = '';
	
	
	 /*-----------------------------------------------------------
     ----------------generowanie kafelek----------------------------
     -----------------------------------------------------------*/
    for (var i = 0; i < memory_array.length; i++) {
        output += '<div class="flip3Dclick front_tile" id="' + memory_array[i] + '_tile_' + i + '"><div class="back" >' + '<img src=\'img/' + memory_array[i] + '.png\'></div><div class="front"></div></div>'
    }
	
   	/*---------------------------------------------------------------------------------------
     -----------------dodanie elementow do naszej planszy, ktore
     ------------powoduja przejscie kolejnych kafelek do nastepnej linii
     ---------------------------------------------------------------------------------------*/
    output += '<div id="koniec">0/' + memory_array.length + '</div>';
	output+='<button  id="wyslij1" class="btn btn-danger" value="Powrot do menu" onClick=\"$(\'#memory_board\').hide();poddajeSie(); $(\'#main_menu\').show();\">Poddaj sie</button>';
	
	output+='<div id="wynik_gracza">';
	output+='<span id="nazwa_gracza">Twoj wynik</span><br>';
	output+='<span id="punkty_gracza">0</span>';
	output+='</div>';
	output+='<div id="twojRuch">Twój ruch!</div>';
	output+='<div id="wynik_przeciwnika">';
	output+='<span id="nazwa_przeciwnika">Wynik przeciwnika</span><br>';
    output+='<span id="punkty_przeciwnika">0</span></div>';
	
    document.getElementById('memory_board').innerHTML = output;
	$('#twojRuch').hide();
	$('#memory_board :nth-child(' + rows + 'n)').after("<div class='flip3Dclick_newline' ></div>");
    

		/*-----------------------------------------------------------
         ---------------zachowanie responsywnosci----------------------------
         -----------------------------------------------------------*/
     resize=function resize() {
        if ($(window).width() < 950) {
            var tmp_rows = rows;
            if (tmp_rows < 4) {
                tmp_rows = 4;
            }
            var cw = ((100 - tmp_rows * 2) / tmp_rows);
			
            $(".flip3Dclick").width(cw + "%").css({
                'padding-bottom': cw + '%'
            }).css({
                'margin': 1 + '%'
            }); //dopasowanie kafelek do szerokosci ekranu
			
            $("#memory_board").css({
                'width': 90 + '%'
            }).css({
                'height': cw*$(window).width()*0.01 * columns * 1.08 + 170 + 'px'
            });//dopasowanie wysokosci planszy do ilosci kafelek
			
        } else{
            $(".flip3Dclick").width(86 + "px").css({
                'padding-bottom': 86 + 'px'
            }).css({
                'margin': 8 + 'px'
            });
            $("#memory_board").css({
                'width': 950 + 'px'
            }).css({
                'height': 86 * columns * 1.08 + 170 + 'px'
            });
        }       
    };

    resize();

    window.addEventListener("resize", function() {
        resize();
    }, true);



    flipClickOff=function(){
        $(".flip3Dclick").off("click");
    };
     flipClickOn=function() {
        $(".flip3Dclick").on("click", function () {

 					
            if (memory_values.length < 2) {
				
				/*-----------------------------------------------------------
                ----------------nacisniecie kafelki----------------------------
                -----------------------------------------------------------*/
                if ($(this).hasClass("front_tile")) {
                    flipit(this, true);
                    moves++;
                    $("#punkty_gracza").html(punkty);
                    $(this).toggleClass("front_tile");
					kliknietaKafelka = this.id;
					
					if(twojRuch){
						socket.emit('sprawdz', "---GUEST wykonuje ruch");
						socket.emit('wykonano ruch', {id_kafelki: kliknietaKafelka, gracz: przeciwnik});	
					}
                   
                    if (memory_values.length == 0) {
                        memory_values.push(this.id.split("_")[0]); //zebranie pierwszej czesci z id do porownania
                        memory_tile_ids.push(this.id); //zebranie id kafelki
                    } else if (memory_values.length == 1) {
                        memory_values.push(this.id.split("_")[0]);
                        memory_tile_ids.push(this.id);
						/*-----------------------------------------------------------
                        ----------------kafelki pasuja do siebie----------------------------
                        -----------------------------------------------------------*/
                        if (memory_values[0] == memory_values[1]) {
                            tiles_flipped += 2;
							
							if(twojRuch){
								punkty+=1;
							 	$("#punkty_gracza").html(punkty);
							 	socket.emit('wyslij punkty',  {punkty: punkty, przeciwnik: przeciwnik});
							}
                            /*var how_to_end = "";
                            how_to_end += tiles_flipped;
                            how_to_end += '/';
                            how_to_end += memory_array.length;
                            $("#koniec").html(how_to_end);*/
							
							// Czysci tablice	
                            memory_values = [];
                            memory_tile_ids = [];
                            

                            if (tiles_flipped == memory_array.length) {		// Sprawdzanie, czy cala tablica zostala poodkrywana
                               // $("#memory_board").append("<button id='to_end_game' onClick=\"$('#memory_board').hide(); \">Dalej</button>");
								konczeGrac();
								function ktoWygral(){
								if(punkty>punktyprzeciwnika){
									wygrana();
								}
								else if(punkty==punktyprzeciwnika){
									remis();
								}
								else{
									przegrana();
								}
							}
							setTimeout( ktoWygral, 500 );	//timeout potrzebny do zaktualizowania punktow
                            }
                            
                            
                        } else {
						/*-----------------------------------------------------------
                        ----------------kafelki NIE pasuja do siebie----------------------------
                        -----------------------------------------------------------*/
                            function flip2Back() {
                                var tile_1 = document.getElementById(memory_tile_ids[0]);
                                var tile_2 = document.getElementById(memory_tile_ids[1]);
                                $(tile_1).toggleClass("front_tile");
                                $(tile_2).toggleClass("front_tile");
                                flipit(tile_1, false);
                                flipit(tile_2, false);


                                // Czyszczenie tablic
                                memory_values = [];
                                memory_tile_ids = [];
                            }
							if(twojRuch){
								socket.emit('sprawdz', "---GUEST wysyla powiadomienie ze przeciwnik sie moze ruszac");
								socket.emit('zmiana tury', {przeciwnik: przeciwnik});
								socket.emit('sprawdz', "---GUEST juz sie nie moze ruszac");
								flipClickOff();
								$( "#twojRuch" ).slideUp();
								twojRuch=false;
							}
                            setTimeout(flip2Back, 700);
                            
                        }
                    }
                }
            }
        });
    };

    flipClickOn();
}