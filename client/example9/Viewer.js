/**************************************************
 File: Viewer.js
 Name: Viewer
 Explain: Viewer
****************************************By QQBoxy*/
/*jshint node: true, esversion: 6 */
'use strict';
import * as THREE from 'three';
import TrackballControls from 'three-trackballcontrols';
import TOPOLOGY from '../common/topology';

var Viewer = function (container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.light = null;
    this.cameraFov = 60;
    this.meshs = [];
    this.controls = null;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.intersects = [];
    this.topologys = [];
};

Viewer.prototype.init = function () {
    var self = this;

    //場景設定
    self.scene = new THREE.Scene();
    //相機設定
    self.camera = new THREE.PerspectiveCamera(self.cameraFov, window.innerWidth / window.innerHeight, 0.1, 1000);

    //渲染器設定
    self.renderer = new THREE.WebGLRenderer();
    self.renderer.setSize(window.innerWidth, window.innerHeight);
    self.container.appendChild(self.renderer.domElement);

    //控制設定
    self.control();

    //光源設定
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    self.scene.add(ambientLight); //加入環境光源
    var pointLight = new THREE.PointLight(0xffffff, 0.8, 0);
    pointLight.position.set(50, 50, 50);
    self.scene.add(pointLight); //加入點光源

    self.camera.position.z = 50;

    //調整視窗大小
    window.addEventListener('resize', self.onResize.bind(self), false);

    //滑鼠設定
    self.container.addEventListener('mousedown', self.onMouseDown.bind(self), false);
    self.container.addEventListener('mouseup', self.onMouseUp.bind(self), false);

    //執行動畫
    self.animate();
};

Viewer.prototype.onResize = function () {
    var self = this;
    self.camera.aspect = window.innerWidth / window.innerHeight;
    self.camera.updateProjectionMatrix();
    self.renderer.setSize(window.innerWidth, window.innerHeight);
};

Viewer.prototype.animate = function () {
    var self = this;
    //循環動畫
    requestAnimationFrame(self.animate.bind(self));
    self.controls.update();
    self.renderer.render(self.scene, self.camera);
};

Viewer.prototype.add = function (bufferGeometry) {
    var self = this;

    //材質設定
    var material = new THREE.MeshPhongMaterial({
        color: Math.floor(Math.random() * 16777215) //Random color
    });

    //網格物件設定
    var mesh = new THREE.Mesh(bufferGeometry, material);
    self.scene.add(mesh);

    self.meshs.push(mesh);

    var geometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);
    var topology = new TOPOLOGY.createFromGeometry(geometry);

    self.topologys.push(topology);
};

Viewer.prototype.clear = function (geometry) {
    var self = this;
    for (var key in self.meshs) {
        self.scene.remove(self.meshs[key]);
    }
};

Viewer.prototype.control = function () {
    var self = this;
    self.controls = new TrackballControls(
        self.camera,
        self.container
    );
};

Viewer.prototype.onMouseDown = function (event) {
    var self = this;
    
    self.mouse.x = (event.clientX / window.innerWidth ) * 2 - 1;
    self.mouse.y = - (event.clientY / window.innerHeight ) * 2 + 1;

    self.raycaster.setFromCamera(self.mouse, self.camera);
    self.intersects = self.raycaster.intersectObjects(self.scene.children);

    if (self.intersects.length > 0) {
        self.controls.enabled = false;

        var geometry = new THREE.SphereBufferGeometry(0.2, 16, 16);
        var material = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });
        var mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.copy(self.intersects[0].point);
        self.scene.add(mesh);
        self.meshs.push(mesh);

        // Method 1
        var faceID = self.intersects[0].faceIndex / 3;
        
        // Method 2
        // var faceIndex = self.intersects[0].faceIndex;
        // var faceID = self.topologys[0].vertex[faceIndex].faceIDs[0];

        var face = self.topologys[0].face[faceID];
        var edges = face.edgeIDs;

        for (var i=0;i<edges.length;i++) {
            var center = self.topologys[0].edge[edges[i]].center;
            var geometry = new THREE.SphereBufferGeometry(0.2, 16, 16);
            var material = new THREE.MeshPhongMaterial({
                color: 0x00ff00
            });
            var mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.copy(center);
            self.scene.add(mesh);
            self.meshs.push(mesh);
        }

    }
};

Viewer.prototype.onMouseUp = function (event) {
    var self = this;
    self.controls.enabled = true;
};

module.exports = Viewer;