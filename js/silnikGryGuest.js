var flipClickOn;
var flipClickOff;
var kliknietaKafelka;
var twojRuch=true;

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



    tiles_flipped = 0;
    output = '';
    for (var i = 0; i < memory_array.length; i++) {
        output += '<div class="flip3Dclick front_tile" id="' + memory_array[i] + '_tile_' + i + '"><div class="back" >' + '<img src=\'img/' + memory_array[i] + '.png\'></div><div class="front"></div></div>';

    }
    /*-----------------------------------------------------------
     ----------------generowanie kafelek----------------------------
     -----------------------------------------------------------*/
    output += '<div id="koniec">0/' + memory_array.length + '</div>';
    output += '<div id="score">  Ruchy: 0</div>';
    document.getElementById('memory_board').innerHTML = output;


    $('#memory_board :nth-child(' + rows + 'n)').after("<div class='flip3Dclick_newline' ></div>");
    /*---------------------------------------------------------------------------------------
     -----------------dodanie elementow do naszej planszy, ktore
     ------------powoduja przejscie kolejnych kafelek do nastepnej linii
     ---------------------------------------------------------------------------------------*/


    function resize() {
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
                'height': cw * columns + 30 + '%'
            });//dopasowanie wysokosci planszy do ilosci kafelek
        } else {
            $(".flip3Dclick").width(86 + "px").css({
                'padding-bottom': 86 + 'px'
            }).css({
                'margin': 8 + 'px'
            });
            $("#memory_board").css({
                'width': 950 + 'px'
            }).css({
                'height': $(".flip3Dclick").width() * columns * 1.08 + 90 + 'px'
            });
        }
        /*-----------------------------------------------------------
         ---------------zachowanie responsywnosci----------------------------
         -----------------------------------------------------------*/

    }

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
                if ($(this).hasClass("front_tile")) {
                    flipit(this, true);
                    moves++;
                    $("#score").html("  Ruchy: " + moves);

                    $(this).toggleClass("front_tile");
					
					
					kliknietaKafelka = this.id;
					if(twojRuch){
						socket.emit('sprawdz', "---GUEST wykonuje ruch");
						socket.emit('wykonano ruch', {id_kafelki: kliknietaKafelka, gracz: przeciwnik});
						
					}
                    /*-----------------------------------------------------------
                     ----------------nacisniecie kafelki----------------------------
                     -----------------------------------------------------------*/
                    if (memory_values.length == 0) {

                        memory_values.push(this.id.split("_")[0]); //zebranie pierwszej czesci z id do porownania
                        memory_tile_ids.push(this.id); //zebranie id kafelki


                    } else if (memory_values.length == 1) {
                        memory_values.push(this.id.split("_")[0]);
                        memory_tile_ids.push(this.id);
                        if (memory_values[0] == memory_values[1]) {

                            tiles_flipped += 2;
                            var how_to_end = "";
                            how_to_end += tiles_flipped;
                            how_to_end += '/';
                            how_to_end += memory_array.length;
                            $("#koniec").html(how_to_end);

                            memory_values = [];
                            memory_tile_ids = [];
                            // Czysci tablice

                            if (tiles_flipped == memory_array.length) {
                                $("#memory_board").append("<button id='to_end_game' onClick=\"$('#memory_board').hide(); \">Dalej</button>");
                            }
                            // Sprawdzanie, czy cala tablica zostala poodkrywana
                            /*-----------------------------------------------------------
                             ----------------kafelki pasuja do siebie----------------------------
                             -----------------------------------------------------------*/
                        } else {
                            function flip2Back() {
                                // Flip the 2 tiles back over
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
							socket.emit('zmiana tury', przeciwnik);
							socket.emit('sprawdz', "---GUEST juz sie nie moze ruszac");
							flipClickOff();
							twojRuch=false;
							}
                            setTimeout(flip2Back, 700);
                            /*-----------------------------------------------------------
                             ----------------kafelki NIE pasuja do siebie----------------------------
                             -----------------------------------------------------------*/
                        }
                    }
                }
            }
        });
    };

    flipClickOn();
    //flipClickOff();
}