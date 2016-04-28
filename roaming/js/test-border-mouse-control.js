/**
 * @author yanhaijing
 */

(function($, g){
    "use strict";
    var
        Game;
        
    Game = function(){
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.width = 0;
        this.height = 0;
        this.body = null;
        this.direction = 0;//为零不运动
    };
    
    Game.prototype = {
        init:function(container){
            this.initPhysijs();
            this.initRenderer(container);           
            this.initScene();
            
            this.initCamera();
            this.initLight();
            this.initGround();
            this.initPlane();
            this.initLoad();
            this.initEvent();
            
            //this.initControls();
            //this.initShapes();                      
            
        },
        initPhysijs:function(){
            g.Physijs.scripts.worker = 'plugin/physijs/physijs_worker.js';
            g.Physijs.scripts.ammo = 'ammo.js';
        },
        
        animation:function(){
            var self = this;
            function render() {
                self.controls.update( self.clock.getDelta() );
                self.renderer.render( self.scene, self.camera );
                requestAnimationFrame( render );
            }
            self.scene.simulate();
            render();
        },
        /**
         * 初始化渲染器
         * @method initRenderer
         * @param {dom} container 渲染器要添加到的dom元素，若不穿如则默认为body元素
         */
        initRenderer:function(container){
            var
                renderer = new THREE.WebGLRenderer({ antialias: true }),
                container = container || document.getElementsByTagName("body")[0],
                width = container.clientWidth,
                height = container.clientHeight;
                
            renderer.setSize( width, height );
            renderer.shadowMapEnabled = true;
            renderer.shadowMapSoft = true;
            container.appendChild( renderer.domElement );
            
            this.width = width;
            this.height =height;
            this.renderer = renderer;
        },
        
        initScene:function(){
             var
                scene = new Physijs.Scene,
                self = this;
            scene.setGravity(new THREE.Vector3( 0, -1000, 0 ));
            scene.addEventListener(
                'update',
                function() {
                    scene.simulate( undefined, 2 );
                }
            );
            
            this.scene = scene;
        },
        initLight:function(){
            var ambientLight = new THREE.AmbientLight( 0xffffff );
                this.scene.add( ambientLight );
        },
        initGround:function(){
            var
                ground_material = Physijs.createMaterial(
                    new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'img/rocks.jpg' ) }),
                    .8, // high friction
                    .4 // low restitution
                ),
                ground;
            ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
            ground_material.map.repeat.set( 3, 3 );
            
            ground = new Physijs.BoxMesh(new THREE.CubeGeometry(30000, 1, 30000), ground_material, 0);
            ground.position.y = -2;
            this.scene.add(ground);
        },
        initControls:function(){
            var controls = null,
                clock = new THREE.Clock();
            function getMesh(obj){

                var rets = [];

                if( !(obj instanceof THREE.Mesh) && obj.children ){

                        for(var i=0; i<obj.children.length;i++){

                                var childs = getMesh(obj.children[i]);

                                for(var j=0; j<childs.length; j++) rets.push( childs[j] );                      

                        }                       

                }else{

                        rets.push( obj );                       

                }               

                return rets;

            }
            controls = new THREE.BorderMouseFirstPersonControls({
                camera: this.camera,
                collisionObject: getMesh(this.object),
                movementSpeed: 1000,
                lookSpeed: 0.1,
                lookVertical: true,
                collisionable:false,
                groundable: true,
                cameraHeight: 1000
            });
            
            this.controls = controls;
            this.clock = clock;
        },
        initCamera:function(){
            var
                camera = new THREE.PerspectiveCamera(
                    35,
                    this.width / this.height,
                    1,
                    100000
                );
            
            camera.position.set(-3500, 1000, 5000);
            camera.lookAt(this.scene.position);
            this.camera = camera;
            this.scene.add(camera);            
        },
        
        initLoad:function(){
            var loader = new THREE.OBJMTLLoader(),
            self = this;
            
            loader.addEventListener( 'load', function ( event ) {

                var object = event.content;
                console.log(object);
                self.object = object;
                self.scene.add( object );
                self.initControls.call(self);
                self.animation.call(self);
                //self.camera.lookAt(new THREE.Vector3(0,-100,0));
    
            });
            
            loader.load( 'obj/room/room.obj', 'obj/room/room.mtl' );
        },
        
        initShapes:function(){
            var
                box = null,
                box_material = new Physijs.createMaterial(
                    new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('img/plywood.jpg')}),
                    1.0, // low friction
                    0.9 // high restitution
                ),
                box_geometry = new THREE.CubeGeometry( 5000, 5000, 5000 ),
                i = 0,
                j = 0,
                len = 10;                   
            box_material.map.wrapS = THREE.RepeatWrapping;
            box_material.map.repeat.set( .25, .25 );
            for(i = 0; i < len; i = i + 1){
                for(j = 0; j < len; j = j + 1){
                    box = new Physijs.BoxMesh(
                        box_geometry,
                        box_material
                    );
                    
                    box.position.set(-50000 + 2.5 + i * 10000, 30000, -50000 + 2.5 + j * 10000);
                    this.scene.add(box);
                }
            }                       
        },
        initPlane:function(){
            var
                T = g.THREE,
                planeGeometry = new T.PlaneGeometry(800,1000),
                planeMaterial = new THREE.MeshBasicMaterial( { color: 0xffb23f } ),
                plane = new T.Mesh(planeGeometry, planeMaterial);
            
            plane.position.set(-3800, 1000, 1600);
            this.scene.add(plane);
            this.planeGeometry = planeGeometry;
            this.plane = plane;
        },
        
        initEvent:function(){
            var
                self = this,
                projector = new THREE.Projector();;
            this.renderer.domElement.addEventListener('click', function(event){
                var
                    x = ( event.clientX / window.innerWidth ) * 2 - 1,
                    y = - ( event.clientY / window.innerHeight ) * 2 + 1;
                    
                var vector = new THREE.Vector3( x, y, 1 );
                projector.unprojectVector( vector, self.camera );

                var raycaster = new THREE.Raycaster( self.camera.position, vector.sub( self.camera.position ).normalize() );

                var intersects = raycaster.intersectObjects( [self.plane] );

                if ( intersects.length > 0 ) {
                    self.camera.position.z = 1000;
                }
            }, false);
            
            this.initKeyEvent();
        },
        
        initKeyEvent:function(){
            var
                self = this;
            
            document.addEventListener('keypress', function(e){
                //按键为c
                if(e.keyCode === 99){
                    self.controls.toggleCollisionable();
                }
            }, false);
        }     
    };
        
    $(function(){
        var
            game = new Game();
            
        game.init($('#view-port').get(0));
    });
}(jQuery, window));
