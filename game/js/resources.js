game.resources = [

    // mainPlayer: space ship
    {name: "player", type: "image", src: "game/data/img/player_ship.png"},

    // ships
    {name: "xlarge", type: "image", src: "game/data/img/shipSuper.png"},  // 320 x 160
    {name: "large",  type: "image", src: "game/data/img/shipLarge.png"},   // 64x64
    {name: "medium", type: "image", src: "game/data/img/shipMedium.png"},  // 32x32
    {name: "small",  type: "image", src: "game/data/img/shipSmall.png"},   // 16x16
    
    // bullet
    {name: "bullet", type: "image", src: "game/data/img/bullet_sprite.png"},

    // explosions
    {name: "explosionSmall", type:"image", src: "game/data/img/animations/explosionSmall.png"},
    {name: "explosionMedium", type:"image", src: "game/data/img/animations/explosionMedium.png"},
    {name: "explosionLarge", type:"image", src: "game/data/img/animations/explosionLarge.png"},
    {name: "explosionSuper", type:"image", src: "game/data/img/animations/explosionSuper.png"},

    /*
     * Maps and backgrounds
     */

    {name: "titleScreen", type: "image", src: "game/data/img/titleScreen.png"},

    // background
    {name: "background", type: "image", src: "game/data/img/background-2.png"},
    
    // tileset
    {name: "sprites", type:"image", src: "game/data/sprites.png"},

    // map
    {name: "area51", type: "tmx", src: "game/data/map/area51-1024.tmx"}
];
