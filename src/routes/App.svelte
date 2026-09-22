<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";
    import * as cga from "./cga3";
    let viewport = $state();
    let scene = $state();
    let freeColors = $state([
        "tomato",
        "limegreen",
        "royalblue",
        "gold",
        "teal",
        "limegreen",
    ]);
    const formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 3,
        useGrouping: false,
    });

    let accordeons = $state({
        export: false,
        expression: false,
        interpreation: true,
        planelike: false,
        spherelike: false,
        linelike: false,
        pointlike: false,
        pointpairlike: false,
        circlelike: false,
        identitylike: false,
        antipodallike: false,
    });

    $effect(() => {
        if (scene) {
            const rect = viewport.getBoundingClientRect();
            scene.updateViewport(rect);
        }
    });

    function updateCamera() {
        if (scene) {
            const rect = viewport.getBoundingClientRect();
            scene.updateViewport(rect);
        }
    }

    onMount(() => {
        const observer = new ResizeObserver(updateCamera);
        observer.observe(viewport);

        return () => {
            updateCamera();
            observer.disconnect();
        };
    });
    let dragging = $state(null);
    let over = $state(null);
    const ii = 0.5;
    let elements = $state([]);
    let showVectorField = $state(false);
    let showIntersections = $state(true);
    let showObject = $state(true);
    const combinedMotor = $derived(
        cga.normalize(
            elements
                .filter((e) => e.active)
                .reduce((a, b) => {
                    return cga.gp(b.el, a);
                }, cga.scalar(1)),
        ),
    );
    const wedgedMotor = $derived(
        cga.normalize(
            elements
                .filter((e) => e.active)
                .reduce((a, b) => cga.wedge(b.el, a), cga.scalar(1)),
        ),
    );
    const summedMotor = $derived(
        cga.normalize(
            elements
                .filter((e) => e.active)
                .reduce((a, b) => cga.add(b.el, a), cga.scalar(0)),
        ),
    );

    const examples = [
        {
            name: "Rotation",
            showVectorField: true,
            elements: [
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "limegreen",
                    active: true,
                    el: [
                        0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
        {
            name: "Line",
            showVectorField: true,
            elements: [
                {
                    active: true,
                    color: "limegreen",
                    el: [
                        0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
        {
            name: "Scaling",

            showVectorField: true,
            elements: [
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 0, 0, 0, 0, 0, 0, 0, -0.7888, 0, 0, 0, 0, 0, 0, 0,
                        0.2112, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "limegreen",
                    active: true,
                    el: [
                        0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
        {
            name: "Circle",
            showVectorField: true,
            elements: [
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "limegreen",
                    active: true,
                    el: [
                        0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
        {
            name: "Point Pair",
            showVectorField: true,
            elements: [
                {
                    color: "limegreen",
                    active: true,
                    el: [
                        0, -2, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -2, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, -2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
        {
            name: "Roto Scale",
            showVectorField: true,
            elements: [
                {
                    color: "limegreen",
                    active: true,
                    el: [
                        0, 0, 0, 0, 0, 0, 0, 0, -1.9449999999999998, 0, 0, 0, 0,
                        0, 0, 0, -0.9449999999999998, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "teal",
                    active: true,
                    el: [
                        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "tomato",
                    active: true,
                    el: [
                        0, 0.9134016707474314, 0, 0, 0.4070594402243987, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
        {
            name: "Screw",
            showVectorField: true,
            elements: [
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 0, 1, 0, 0, 0, 0, 0, 0.14, 0, 0, 0, 0, 0, 0, 0, 0.14,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "limegreen",
                    active: true,
                    el: [
                        0, 0, 1, 0, 0, 0, 0, 0, -0.23, 0, 0, 0, 0, 0, 0, 0,
                        -0.23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "teal",
                    active: true,
                    el: [
                        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "tomato",
                    active: true,
                    el: [
                        0, 0.9338567516961642, 0, 0, 0.35764726660704166, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
        {
            name: "Loxodrome",
            showVectorField: true,
            elements: [
                {
                    active: true,
                    color: "royalblue",
                    el: [
                        0, 0, 0, 0, 0, 0.5773502691896258, 0, 0,
                        0.5773502691896258, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0.5773502691896258, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0,
                    ],
                },
            ],
        },
        {
            name: "Double Rotation",
            showVectorField: true,
            elements: [
                {
                    color: "limegreen",
                    active: true,
                    el: [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                },
                {
                    color: "teal",
                    active: true,
                    el: [
                        0, 0.9338567516961642, 0.35764726660704166, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
        {
            name: "Double Circle",
            showVectorField: true,
            elements: [
                {
                    active: true,
                    color: "tomato",
                    el: [
                        0, 0, 0, 0, 0, 0, -0.6324555320336759, 0, 0,
                        0.6324555320336759, 0.31622776601683794, 0, 0, 0, 0, 0,
                        0, 0, -0.31622776601683794, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0,
                    ],
                },
            ],
        },

        {
            name: "Smoke Rings",

            showVectorField: true,
            elements: [
                {
                    active: true,
                    color: "royalblue",
                    el: [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7071067811865475, 0, 0, 0,
                        0, 0, 0, 0, 0, 0.7071067811865475, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0,
                    ],
                },
            ],
        },
    ];

    function loadExample(i) {
        const ex = examples[i];
        if (!ex) {
            return;
        }
        while (elements.length) {
            freeColors.unshift(elements.pop().color);
        }
        for (let e = 0; e < ex.elements.length; e++) {
            elements.push({
                ...ex.elements[e],
                el: new Float64Array(
                    Object.keys(ex.elements[e].el)
                        .sort((a, b) => a - b)
                        .map((k) => ex.elements[e].el[k]),
                ),
                color: freeColors.shift() || ex.elements[e].color,
            });
        }
        showVectorField = ex.showVectorField;
    }
</script>

<svelte:head>
    <title>3d CGA</title>
</svelte:head>

<div class="app">
    <div class="screen">
        <svelte:boundary>
            <Canvas dpr={Math.max(window ? window.devicePixelRatio : 1, 2)}>
                <Scene
                    {showVectorField}
                    {showIntersections}
                    {showObject}
                    bind:elements
                    wedged={elements.length > 1 &&
                    wedgedMotor &&
                    cga.isVersor(wedgedMotor)
                        ? wedgedMotor
                        : cga.scalar(1)}
                    motor={combinedMotor}
                    bind:this={scene}
                />
            </Canvas>
        </svelte:boundary>
    </div>
    <div
        style:display={scene ? "none" : "grid"}
        style="position: absolute; inset: 0; width: 100%; height: 100%; background-color: white; justify-content: center; align-content: center;"
    ></div>
    <div
        style:display={scene ? "none" : "grid"}
        style="z-index: 1000; grid-area: viewport; width: 100%; height: 100%; background-color: white; justify-content: center; align-content: center;"
    >
        Loading
    </div>
    <div bind:this={viewport} class="viewport"></div>
    <div class="toolbar">
        <fieldset class="fieldset-mini">
            <legend>Identity</legend>
            <fieldset class="fieldset-sub">
                <legend>Grade 0 <br />(Identity/Scalar)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.scalar(1),
                            });
                        }}>1</button
                    >
                </div>
            </fieldset>
            <fieldset class="fieldset-sub">
                <legend>Grade 5<br /> (Pseudoscalar) </legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.undual(cga.scalar(1)),
                            });
                        }}>I</button
                    >
                </div>
            </fieldset>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Plane</legend>
            <fieldset class="fieldset-sub">
                <legend>Grade 1 (Reflecting)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.plane([1, 0, 0], 0),
                            });
                        }}>e1</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.plane([0, 1, 0], 0),
                            });
                        }}>e2</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.plane([0, 0, 1], 0),
                            });
                        }}>e3</button
                    >
                </div>
            </fieldset>
            <fieldset class="fieldset-sub">
                <legend>Grade 4 (Directing)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(cga.plane([-1, 0, 0], 0)),
                            });
                        }}>e23pm</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(cga.plane([0, 1, 0], 0)),
                            });
                        }}>e13pm</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(cga.plane([0, 0, -1], 0)),
                            });
                        }}>e12pm</button
                    >
                </div>
            </fieldset>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Sphere</legend>
            <fieldset class="fieldset-sub">
                <legend>Grade 1 (Reflecting)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.sphere(0, 0, 0, 1),
                            });
                        }}>ep</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.sphere(0, 0, 0, 0),
                            });
                        }}>ep - em</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.add(cga.ep, cga.em),
                            });
                        }}>ep + em</button
                    >
                </div>
            </fieldset>
            <fieldset class="fieldset-sub">
                <legend>Grade 4 (Directing)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(cga.sphere(0, 0, 0, 1)),
                            });
                        }}>e123m</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.undual(cga.sphere(0, 0, 0, 0)),
                            });
                        }}>e123p - e123m</button
                    >
                </div>
            </fieldset>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Line</legend>
            <fieldset class="fieldset-sub">
                <legend>Grade 2 (Reflecting)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.gp(
                                    cga.plane([1, 0, 0], 0),
                                    cga.plane([0, 0, 1], 0),
                                ),
                            });
                        }}>e13</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.gp(
                                    cga.plane([0, 1, 0], 0),
                                    cga.plane([0, 0, 1], 0),
                                ),
                            });
                        }}>e23</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.gp(
                                    cga.plane([1, 0, 0], 0),
                                    cga.plane([0, 1, 0], 0),
                                ),
                            });
                        }}>e12</button
                    >
                </div>
            </fieldset>
            <fieldset class="fieldset-sub">
                <legend>Grade 4 (Directing)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.gp(
                                        cga.plane([1, 0, 0], 0),
                                        cga.plane([0, 1, 0], 0),
                                    ),
                                ),
                            });
                        }}>e3pm</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.gp(
                                        cga.plane([0, 0, 1], 0),
                                        cga.plane([1, 0, 0], 0),
                                    ),
                                ),
                            });
                        }}>e2pm</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.gp(
                                        cga.plane([0, 1, 0], 0),
                                        cga.plane([0, 0, 1], 0),
                                    ),
                                ),
                            });
                        }}>e1pm</button
                    >
                </div>
            </fieldset>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Point</legend>
            <fieldset class="fieldset-sub">
                <legend>Grade 3 (Reflecting)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.pointReflection(0, 0.0, 0.0),
                            });
                        }}>e123</button
                    >
                </div>
            </fieldset>
            <fieldset class="fieldset-sub">
                <legend>Grade 2 (Directing)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(cga.pointReflection(0, 0.0, 0.0)),
                            });
                        }}>epm</button
                    >
                </div>
            </fieldset>
        </fieldset>

        <fieldset class="fieldset-mini">
            <legend>Add Point Pair</legend>
            <fieldset class="fieldset-sub">
                <legend>Grade 2 (Directing)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.pointPair(
                                    cga.zeroSphere(1, 0.0, 0.0),
                                    cga.zeroSphere(-1, 0.0, 0.0),
                                ),
                            });
                        }}>e1m</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.pointPair(
                                    cga.zeroSphere(0.0, 1, 0.0),
                                    cga.zeroSphere(0.0, -1, 0.0),
                                ),
                            });
                        }}>e2m</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.pointPair(
                                    cga.zeroSphere(0.0, 0.0, 1),
                                    cga.zeroSphere(0.0, 0.0, -1),
                                ),
                            });
                        }}>e3m</button
                    >
                </div>
            </fieldset>
            <fieldset class="fieldset-sub">
                <legend>Grade 3 (Reflecting)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.pointPair(
                                        cga.zeroSphere(1, 0.0, 0.0),
                                        cga.zeroSphere(-1, 0.0, 0.0),
                                    ),
                                ),
                            });
                        }}>e23p</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.pointPair(
                                        cga.zeroSphere(0.0, -1, 0.0),
                                        cga.zeroSphere(0.0, 1, 0.0),
                                    ),
                                ),
                            });
                        }}>e13p</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.pointPair(
                                        cga.zeroSphere(0.0, 0.0, 1),
                                        cga.zeroSphere(0.0, 0.0, -1),
                                    ),
                                ),
                            });
                        }}>e12p</button
                    >
                </div>
            </fieldset>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Circle</legend>
            <fieldset class="fieldset-sub">
                <legend>Grade 2 (Reflecting)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.circle([0, 0, 0], 1, [1, 0, 0]),
                            });
                        }}>e1p</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.circle([0, 0, 0], 1, [0, 1, 0]),
                            });
                        }}>e2p</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.circle([0, 0, 0], 1, [0, 0, 1]),
                            });
                        }}>e3p</button
                    >
                </div>
            </fieldset>
            <fieldset class="fieldset-sub">
                <legend>Grade 3 (Directing)</legend>

                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.circle([0, 0, 0], 1, [1, 0, 0]),
                                ),
                            });
                        }}>e23m</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.circle([0, 0, 0], 1, [0, -1, 0]),
                                ),
                            });
                        }}>e13m</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.dual(
                                    cga.circle([0, 0, 0], 1, [0, 0, 1]),
                                ),
                            });
                        }}>e12m</button
                    >
                </div>
            </fieldset>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Antipodality</legend>
            <fieldset class="fieldset-sub">
                <legend>Grade 4 (Reflecting)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.wedge(cga.e123, cga.ep),
                            });
                        }}>e123p</button
                    >
                </div>
            </fieldset>
            <fieldset class="fieldset-sub">
                <legend>Grade 1 (Directing)</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.shift(),
                                active: true,
                                el: cga.em,
                            });
                        }}>em</button
                    >
                </div>
            </fieldset>
        </fieldset>
    </div>
    <div class="menu">
        <header>
            <h1>3D Conformal Transformations (WIP)</h1>
            <p style:font-size="smaller">
                based on and inspired by
                <a
                    href="https://www.youtube.com/watch?v=q3as9SGmDdw"
                    target="_blank">Hamish Todd's Funhouse Mirror</a
                >
            </p>
            <p style:font-size="smaller">
                <a
                    href="https://tools.laszlokorte.de/"
                    style:text-decoration="none"
                    target="_blank"
                >
                    <img
                        class="texticon"
                        alt=""
                        src="https://tools.laszlokorte.de/favicon.svg"
                    />
                    <span style:text-decoration="underline"
                        >More Educational Tools</span
                    >
                </a>
            </p>
        </header>

        <div class="button-row">
            <div>
                <fieldset class="fieldset-mini">
                    <legend>Examples</legend>
                    <div class="button-row">
                        {#each examples as ex, exi}
                            <button
                                onclick={(evt) => {
                                    loadExample(exi);
                                }}>{ex.name}</button
                            >
                        {/each}
                    </div>
                </fieldset>
            </div>

            <fieldset class="fieldset-mini">
                <legend>Show</legend>
                <div class="button-row">
                    <div class="button-row">
                        <label
                            ><input
                                type="checkbox"
                                bind:checked={showVectorField}
                            /> Vector Field</label
                        >
                        <label
                            ><input
                                type="checkbox"
                                bind:checked={showIntersections}
                            /> Wedge/Intersect</label
                        >
                        <label
                            ><input type="checkbox" bind:checked={showObject} />
                            Example Object</label
                        >
                    </div>
                </div>
            </fieldset>

            <details bind:open={accordeons.export}>
                <summary>Export</summary>
                <textarea class="serialized" readonly
                    >{JSON.stringify(elements, (key, value) =>
                        value instanceof Float64Array
                            ? Array.from(value)
                            : value,
                    )}</textarea
                >
            </details>
            <fieldset class="fieldset-mini">
                <legend
                    >All (SN: {Math.sign(
                        cga.spinorNorm(combinedMotor),
                    )})</legend
                >
                <div class="button-row">
                    <button
                        disabled={elements.length == 0}
                        onclick={(evt) => {
                            while (elements.length) {
                                freeColors.unshift(elements.pop().color);
                            }
                        }}>Delete all</button
                    >
                    <button
                        disabled={elements.length == 0}
                        onclick={(evt) => {
                            elements = elements.map((e) => {
                                return { ...e, el: cga.dual(e.el) };
                            });
                        }}
                        title="Dual all"
                    >
                        ★
                    </button>
                    <button
                        title="Negate all"
                        disabled={elements.length == 0}
                        onclick={(evt) => {
                            elements = elements.map((e) => {
                                return { ...e, el: cga.scale(-1, e.el) };
                            });
                        }}
                        >-
                    </button>
                    <button
                        title="Reverse order"
                        disabled={elements.length < 2}
                        onclick={(evt) => {
                            elements = elements.toReversed();
                        }}>⇋</button
                    >

                    <button
                        title="Geometric Product multiply all"
                        disabled={elements.length == 1 ||
                            !combinedMotor ||
                            !cga.isVersor(combinedMotor)}
                        onclick={(evt) => {
                            const cmb = combinedMotor;
                            while (elements.length) {
                                freeColors.unshift(elements.pop().color);
                            }
                            elements.push({
                                active: true,
                                color: freeColors.shift(),
                                el: cmb,
                            });
                        }}>&prod;</button
                    >
                    <button
                        title="Wedge all"
                        disabled={!wedgedMotor || !cga.isVersor(wedgedMotor)}
                        onclick={(evt) => {
                            const cmb = wedgedMotor;
                            while (elements.length) {
                                freeColors.unshift(elements.pop().color);
                            }
                            elements.push({
                                active: true,
                                color: freeColors.shift(),
                                el: cmb,
                            });
                        }}>&wedge;</button
                    >
                    <button
                        title="Sum all"
                        disabled={!summedMotor}
                        onclick={(evt) => {
                            const cmb = summedMotor;
                            while (elements.length) {
                                freeColors.unshift(elements.pop().color);
                            }
                            elements.push({
                                active: true,
                                color: freeColors.shift(),
                                el: cmb,
                            });
                        }}
                        >&sum;
                    </button>
                </div>
            </fieldset>
        </div>
        <div class="block-list">
            {#each elements as { el, color }, eli}
                <div
                    class={{
                        element: true,
                        dragging: dragging == eli,
                        hover: over == eli,
                    }}
                    role="button"
                    tabindex="-1"
                    ondrop={(evt) => {
                        const from = JSON.parse(
                            evt.dataTransfer.getData("text/plain"),
                        );
                        const to = eli;
                        const fromIndex = Number(from.index);

                        if (fromIndex === to) return;
                        if (from.type == "cga-reorder") {
                            const item = elements[fromIndex];
                            const rest = [
                                ...elements.slice(0, fromIndex),
                                ...elements.slice(fromIndex + 1),
                            ];

                            elements = [
                                ...rest.slice(0, to),
                                item,
                                ...rest.slice(to),
                            ];
                        } else if (
                            from.type == "cga-sum" &&
                            freeColors.length
                        ) {
                            const sum = cga.add(
                                elements[to].el,
                                elements[fromIndex].el,
                            );
                            if (cga.isVersor(sum)) {
                                elements.push({
                                    el: sum,
                                    color: freeColors.shift(),
                                    active: false,
                                });
                            }
                        } else if (
                            from.type == "cga-sub" &&
                            freeColors.length
                        ) {
                            elements.push({
                                el: cga.sub(
                                    elements[to].el,
                                    elements[fromIndex].el,
                                ),
                                color: freeColors.shift(),
                                active: false,
                            });
                        } else if (from.type == "cga-gp" && freeColors.length) {
                            elements.push({
                                el: cga.gp(
                                    elements[to].el,
                                    elements[fromIndex].el,
                                ),

                                color: freeColors.shift(),
                                active: true,
                            });
                        } else if (
                            from.type == "cga-wedge" &&
                            freeColors.length
                        ) {
                            elements.push({
                                el: cga.wedge(
                                    cga.normalize(elements[to].el),
                                    cga.normalize(elements[fromIndex].el),
                                ),
                                color: freeColors.shift(),
                                active: true,
                            });
                        } else if (
                            from.type == "cga-meet" &&
                            freeColors.length
                        ) {
                            elements.push({
                                el: cga.meet(
                                    cga.normalize(elements[to].el),
                                    cga.normalize(elements[fromIndex].el),
                                ),
                                color: freeColors.shift(),
                                active: true,
                            });
                        } else if (
                            from.type == "cga-wedgeinf" &&
                            freeColors.length
                        ) {
                            elements.push({
                                el: cga.wedge(
                                    cga.wedge(
                                        cga.normalize(elements[to].el),
                                        cga.normalize(elements[fromIndex].el),
                                    ),
                                    cga.einf,
                                ),
                                color: freeColors.shift(),
                                active: true,
                            });
                        }

                        dragging = null;
                        over = null;
                    }}
                    ondragover={(evt) => {
                        const from = JSON.parse(
                            evt.dataTransfer.getData("text/plain"),
                        );
                        const to = eli;
                        if (to !== Number(from.index)) {
                            evt.preventDefault();

                            over = eli;
                        }
                    }}
                    style:--color={color}
                >
                    <div class="element-side">
                        <label
                            style:grid-column="span 2"
                            style:justify-content="center"
                            class="form-checkbox"
                        >
                            <input
                                type="checkbox"
                                bind:checked={elements[eli].active}
                            />
                            Active
                        </label>
                        <button
                            class="element-button"
                            onclick={(evt) => {
                                freeColors.unshift(color);
                                elements = elements.filter((_, i) => i !== eli);
                            }}
                            title="Delete"
                        >
                            🗑
                        </button>
                        <div
                            class="element-button"
                            role="button"
                            tabindex="-1"
                            draggable="true"
                            ondragstart={(evt) => {
                                evt.dataTransfer.setData(
                                    "text/plain",
                                    JSON.stringify({
                                        type: "cga-reorder",
                                        index: eli,
                                    }),
                                );
                                dragging = eli;
                            }}
                            ondragend={(evt) => {
                                dragging = null;
                                over = null;
                            }}
                            title="Reorder"
                        >
                            ☰
                        </div>

                        <button
                            class="element-button"
                            onclick={(evt) => {
                                elements[eli].el = cga.dual(elements[eli].el);
                            }}
                            title="Dual"
                        >
                            ★
                        </button>
                        <button
                            class="element-button"
                            onclick={(evt) => {
                                elements[eli].el = cga.undual(elements[eli].el);
                            }}
                            title="Undual"
                        >
                            ✩
                        </button>
                        <button
                            class="element-button"
                            onclick={(evt) => {
                                elements[eli].el = cga.scale(
                                    -1,
                                    elements[eli].el,
                                );
                            }}
                            title="Negate"
                        >
                            -
                        </button>
                        <button
                            class="element-button"
                            onclick={(evt) => {
                                elements[eli].el = cga.normalize(
                                    elements[eli].el,
                                );
                            }}
                            title="Normalize"
                        >
                            ||
                        </button>
                        <fieldset class="gridset">
                            <legend>Binary</legend>

                            <div
                                class="element-button"
                                role="button"
                                tabindex="-1"
                                draggable="true"
                                title="Binary Addition (Drag onto other)"
                                ondragstart={(evt) => {
                                    evt.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                            type: "cga-sum",
                                            index: eli,
                                        }),
                                    );
                                    dragging = eli;
                                }}
                                ondragend={(evt) => {
                                    dragging = null;
                                    over = null;
                                }}
                            >
                                +
                            </div>
                            <div
                                title="Binary Subtraction (Drag onto other)"
                                class="element-button"
                                role="button"
                                tabindex="-1"
                                draggable="true"
                                ondragstart={(evt) => {
                                    evt.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                            type: "cga-sub",
                                            index: eli,
                                        }),
                                    );
                                    dragging = eli;
                                }}
                                ondragend={(evt) => {
                                    dragging = null;
                                    over = null;
                                }}
                            >
                                -
                            </div>
                            <div
                                class="element-button"
                                role="button"
                                tabindex="-1"
                                draggable="true"
                                title="Geometric Product (Drag onto other)"
                                ondragstart={(evt) => {
                                    evt.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                            type: "cga-gp",
                                            index: eli,
                                        }),
                                    );
                                    dragging = eli;
                                }}
                                ondragend={(evt) => {
                                    dragging = null;
                                    over = null;
                                }}
                            >
                                gp
                            </div>
                            <div
                                class="element-button"
                                role="button"
                                tabindex="-1"
                                draggable="true"
                                title="Wedge Product (Drag onto other)"
                                ondragstart={(evt) => {
                                    evt.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                            type: "cga-wedge",
                                            index: eli,
                                        }),
                                    );
                                    dragging = eli;
                                }}
                                ondragend={(evt) => {
                                    dragging = null;
                                    over = null;
                                }}
                            >
                                &wedge;
                            </div>
                            <div
                                class="element-button"
                                role="button"
                                tabindex="-1"
                                draggable="true"
                                title="Meet (Drag onto other)"
                                ondragstart={(evt) => {
                                    evt.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                            type: "cga-meet",
                                            index: eli,
                                        }),
                                    );
                                    dragging = eli;
                                }}
                                ondragend={(evt) => {
                                    dragging = null;
                                    over = null;
                                }}
                            >
                                meet
                            </div>
                            <div
                                class="element-button"
                                role="button"
                                tabindex="-1"
                                draggable="true"
                                title="Binary Wedge Product with other and e_inf (Drag onto other)"
                                ondragstart={(evt) => {
                                    evt.dataTransfer.setData(
                                        "text/plain",
                                        JSON.stringify({
                                            type: "cga-wedgeinf",
                                            index: eli,
                                        }),
                                    );
                                    dragging = eli;
                                }}
                                ondragend={(evt) => {
                                    dragging = null;
                                    over = null;
                                }}
                            >
                                &wedge;&infin;
                            </div>
                        </fieldset>
                    </div>
                    <div class="element-head">
                        <label class="form-row">
                            <input
                                type="color"
                                bind:value={elements[eli].color}
                            />
                            <input
                                style:width="8em"
                                type="text"
                                bind:value={elements[eli].color}
                            />
                        </label>
                    </div>
                    <div class="accordeon">
                        <details
                            bind:open={accordeons.expression}
                            class="accordeon-item"
                        >
                            <summary>Algebraic Expression</summary>
                            <textarea
                                class="serialized"
                                readonly
                                style:user-select="all"
                                >{cga.toString(el)}</textarea
                            >
                        </details>
                        <details
                            bind:open={accordeons.interpreation}
                            class="accordeon-item"
                        >
                            <summary
                                >Interpretation,
                                <span
                                    >Spinor Norm:
                                    <code>
                                        {{
                                            "1": "+",
                                            "-1": "-",
                                            "0": 0,
                                        }[Math.sign(cga.spinorNorm(el))]}
                                    </code>
                                </span>,
                                <span
                                    >Grades:
                                    <code>
                                        {[0, 1, 2, 3, 4, 5]
                                            .filter((g) => cga.hasGrade(el, g))
                                            .join(", ")}
                                    </code>
                                </span>
                            </summary>
                            <div>
                                {#if cga.isSphereAtInfinity(el)}
                                    <strong>Sphere at Infinity</strong>
                                {:else if cga.isSphere(el)}
                                    <strong>Sphere (Reflecting)</strong>
                                    {@const sphCoords =
                                        cga.sphereParameters(el)}
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );

                                            elements[eli].el = cga.sphere(
                                                1 * fd.x,
                                                1 * fd.y,
                                                1 * fd.z,
                                                1 * fd.radius,
                                                1 * fd.sign,
                                            );
                                        }}
                                    >
                                        <label class="form-row">
                                            X:
                                            <input
                                                type="range"
                                                name="x"
                                                value={sphCoords.center[0]}
                                                min="-2"
                                                max="2"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Y:
                                            <input
                                                type="range"
                                                name="y"
                                                value={sphCoords.center[1]}
                                                min="-2"
                                                max="2"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Z:
                                            <input
                                                type="range"
                                                name="z"
                                                value={sphCoords.center[2]}
                                                min="-2"
                                                max="2"
                                                step="0.01"
                                            />
                                        </label>

                                        <label class="form-row">
                                            Radius:
                                            <input
                                                type="range"
                                                name="radius"
                                                value={sphCoords.radius}
                                                min="-4"
                                                max="4"
                                                step="0.01"
                                            />
                                        </label>
                                        <input
                                            type="hidden"
                                            name="sign"
                                            value="1"
                                        />
                                        <label class="form-row">
                                            negative:
                                            <input
                                                type="checkbox"
                                                name="sign"
                                                value="-1"
                                                checked={sphCoords.sign < 0}
                                            />
                                        </label>
                                    </form>
                                {:else if cga.isSphere(cga.dual(el))}
                                    <strong>Sphere (Directing)</strong>
                                    {@const sphCoords = cga.sphereParameters(
                                        cga.dual(el),
                                    )}
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );

                                            elements[eli].el = cga.undual(
                                                cga.sphere(
                                                    1 * fd.x,
                                                    1 * fd.y,
                                                    1 * fd.z,
                                                    1 * fd.radius,
                                                    1 * fd.sign,
                                                ),
                                            );
                                        }}
                                    >
                                        <label class="form-row">
                                            X:
                                            <input
                                                type="range"
                                                name="x"
                                                value={sphCoords.center[0]}
                                                min="-2"
                                                max="2"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Y:
                                            <input
                                                type="range"
                                                name="y"
                                                value={sphCoords.center[1]}
                                                min="-2"
                                                max="2"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Z:
                                            <input
                                                type="range"
                                                name="z"
                                                value={sphCoords.center[2]}
                                                min="-2"
                                                max="2"
                                                step="0.01"
                                            />
                                        </label>

                                        <label class="form-row">
                                            Radius:
                                            <input
                                                type="range"
                                                name="radius"
                                                value={sphCoords.radius}
                                                min="-4"
                                                max="4"
                                                step="0.01"
                                            />
                                        </label>
                                        <input
                                            type="hidden"
                                            name="sign"
                                            value="1"
                                        />
                                        <label class="form-row">
                                            negative:
                                            <input
                                                type="checkbox"
                                                name="sign"
                                                value="-1"
                                                checked={sphCoords.sign < 0}
                                            />
                                        </label>
                                    </form>
                                {:else if cga.isPlane(el)}
                                    <strong>Plane (Reflecting)</strong>
                                    {@const plnParams = cga.planeParameters(el)}
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );

                                            elements[eli].el = cga.plane(
                                                [1 * fd.x, 1 * fd.y, 1 * fd.z],
                                                1 * fd.distance,
                                            );
                                        }}
                                    >
                                        <label class="form-row">
                                            X:
                                            <input
                                                type="range"
                                                name="x"
                                                value={plnParams.normal[0]}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Y:
                                            <input
                                                type="range"
                                                name="y"
                                                value={plnParams.normal[1]}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Z:
                                            <input
                                                type="range"
                                                name="z"
                                                value={plnParams.normal[2]}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>

                                        <label class="form-row">
                                            Distance:
                                            <input
                                                type="range"
                                                name="distance"
                                                value={plnParams.distance}
                                                min="-2"
                                                max="2"
                                                step="0.01"
                                            />
                                        </label>
                                    </form>
                                {:else if cga.isPlane(cga.dual(el))}
                                    <strong>Plane (Directing)</strong>
                                    {@const plnParams = cga.planeParameters(
                                        cga.dual(el),
                                    )}
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );

                                            elements[eli].el = cga.undual(
                                                cga.plane(
                                                    [
                                                        1 * fd.x,
                                                        1 * fd.y,
                                                        1 * fd.z,
                                                    ],
                                                    1 * fd.distance,
                                                ),
                                            );
                                        }}
                                    >
                                        <label class="form-row">
                                            X:
                                            <input
                                                type="range"
                                                name="x"
                                                value={plnParams.normal[0]}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Y:
                                            <input
                                                type="range"
                                                name="y"
                                                value={plnParams.normal[1]}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Z:
                                            <input
                                                type="range"
                                                name="z"
                                                value={plnParams.normal[2]}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>

                                        <label class="form-row">
                                            Distance:
                                            <input
                                                type="range"
                                                name="distance"
                                                value={plnParams.distance}
                                                min="-2"
                                                max="2"
                                                step="0.01"
                                            />
                                        </label>
                                    </form>
                                {:else if cga.isPointPair(el)}
                                    <strong>Point Pair</strong>
                                    {@const [a, b] = cga.pointPairCoords(el)}
                                    <div
                                        style="display: grid; grid-template-columns: 1fr 1fr"
                                    >
                                        <form
                                            oninput={(evt) => {
                                                const fd = Object.fromEntries(
                                                    new FormData(
                                                        evt.currentTarget,
                                                    ),
                                                );

                                                const npp = cga.pointPair(
                                                    cga.zeroSphere(
                                                        fd.x,
                                                        fd.y,
                                                        fd.z,
                                                    ),
                                                    cga.zeroSphere(
                                                        b.x,
                                                        b.y,
                                                        b.z,
                                                    ),
                                                );
                                                if (cga.isPointPair(npp))
                                                    elements[eli].el = npp;
                                            }}
                                        >
                                            <label class="form-row">
                                                X:
                                                <input
                                                    type="range"
                                                    name="x"
                                                    value={a.x}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                            <label class="form-row">
                                                Y:
                                                <input
                                                    type="range"
                                                    name="y"
                                                    value={a.y}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                            <label class="form-row">
                                                Z:
                                                <input
                                                    type="range"
                                                    name="z"
                                                    value={a.z}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                        </form>
                                        <form
                                            oninput={(evt) => {
                                                const fd = Object.fromEntries(
                                                    new FormData(
                                                        evt.currentTarget,
                                                    ),
                                                );

                                                const npp = cga.pointPair(
                                                    cga.zeroSphere(
                                                        a.x,
                                                        a.y,
                                                        a.z,
                                                    ),
                                                    cga.zeroSphere(
                                                        fd.x,
                                                        fd.y,
                                                        fd.z,
                                                    ),
                                                );
                                                if (cga.isPointPair(npp))
                                                    elements[eli].el = npp;
                                            }}
                                        >
                                            <label class="form-row">
                                                X:
                                                <input
                                                    type="range"
                                                    name="x"
                                                    value={b.x}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                            <label class="form-row">
                                                Y:
                                                <input
                                                    type="range"
                                                    name="y"
                                                    value={b.y}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                            <label class="form-row">
                                                Z:
                                                <input
                                                    type="range"
                                                    name="z"
                                                    value={b.z}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                        </form>
                                    </div>
                                {:else if cga.isPointPair(cga.dual(el))}
                                    <strong>Point Pair (Dual)</strong>
                                    {@const [b, a] = cga.pointPairCoords(
                                        cga.dual(el),
                                    )}
                                    <div
                                        style="display: grid; grid-template-columns: 1fr 1fr"
                                    >
                                        <form
                                            oninput={(evt) => {
                                                const fd = Object.fromEntries(
                                                    new FormData(
                                                        evt.currentTarget,
                                                    ),
                                                );

                                                const npp = cga.pointPair(
                                                    cga.zeroSphere(
                                                        b.x,
                                                        b.y,
                                                        b.z,
                                                    ),
                                                    cga.zeroSphere(
                                                        fd.x,
                                                        fd.y,
                                                        fd.z,
                                                    ),
                                                );
                                                if (cga.isPointPair(npp))
                                                    elements[eli].el =
                                                        cga.undual(npp);
                                            }}
                                        >
                                            <label class="form-row">
                                                X:
                                                <input
                                                    type="range"
                                                    name="x"
                                                    value={a.x}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                            <label class="form-row">
                                                Y:
                                                <input
                                                    type="range"
                                                    name="y"
                                                    value={a.y}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                            <label class="form-row">
                                                Z:
                                                <input
                                                    type="range"
                                                    name="z"
                                                    value={a.z}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                        </form>
                                        <form
                                            oninput={(evt) => {
                                                const fd = Object.fromEntries(
                                                    new FormData(
                                                        evt.currentTarget,
                                                    ),
                                                );

                                                const npp = cga.pointPair(
                                                    cga.zeroSphere(
                                                        fd.x,
                                                        fd.y,
                                                        fd.z,
                                                    ),
                                                    cga.zeroSphere(
                                                        a.x,
                                                        a.y,
                                                        a.z,
                                                    ),
                                                );
                                                if (cga.isPointPair(npp))
                                                    elements[eli].el =
                                                        cga.undual(npp);
                                            }}
                                        >
                                            <label class="form-row">
                                                X:
                                                <input
                                                    type="range"
                                                    name="x"
                                                    value={b.x}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                            <label class="form-row">
                                                Y:
                                                <input
                                                    type="range"
                                                    name="y"
                                                    value={b.y}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                            <label class="form-row">
                                                Z:
                                                <input
                                                    type="range"
                                                    name="z"
                                                    value={b.z}
                                                    min="-1"
                                                    max="1"
                                                    step="0.01"
                                                />
                                            </label>
                                        </form>
                                    </div>
                                {:else if cga.isCircle(el)}
                                    <strong>Circle</strong>
                                    {@const cirParams =
                                        cga.circleParameters(el)}

                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );
                                            if (
                                                Math.hypot(
                                                    fd.nx,
                                                    fd.ny,
                                                    fd.nz,
                                                ) > 0 &&
                                                fd.radius > 0
                                            ) {
                                                const nc = cga.circle(
                                                    [
                                                        1 * fd.x,
                                                        1 * fd.y,
                                                        1 * fd.z,
                                                    ],
                                                    1 * fd.radius,
                                                    [
                                                        1 * fd.nx,
                                                        1 * fd.ny,
                                                        1 * fd.nz,
                                                    ],
                                                );

                                                if (cga.isCircle(nc)) {
                                                    elements[eli].el = nc;
                                                }
                                            }
                                        }}
                                    >
                                        <div
                                            style="display: grid; gap: 1ex; grid-template-columns: 1fr 1fr;"
                                        >
                                            <label
                                                class="form-row"
                                                style:grid-column="1 / -1"
                                            >
                                                Radius:
                                                <input
                                                    type="range"
                                                    name="radius"
                                                    value={cirParams.radius}
                                                    min="0"
                                                    max="1"
                                                    step="0.001"
                                                />
                                            </label>
                                            <div>
                                                <label class="form-row">
                                                    X:
                                                    <input
                                                        type="range"
                                                        name="x"
                                                        value={cirParams
                                                            .center[0]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Y:
                                                    <input
                                                        type="range"
                                                        name="y"
                                                        value={cirParams
                                                            .center[1]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Z:
                                                    <input
                                                        type="range"
                                                        name="z"
                                                        value={cirParams
                                                            .center[2]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                            </div>
                                            <div>
                                                <label class="form-row">
                                                    NX:
                                                    <input
                                                        type="range"
                                                        name="nx"
                                                        value={cirParams
                                                            .normal[0]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    NY:
                                                    <input
                                                        type="range"
                                                        name="ny"
                                                        value={cirParams
                                                            .normal[1]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    NZ:
                                                    <input
                                                        type="range"
                                                        name="nz"
                                                        value={cirParams
                                                            .normal[2]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                {:else if cga.isCircle(cga.dual(el))}
                                    <strong>Circle (Direct)</strong>
                                    {@const cirParams = cga.circleParameters(
                                        cga.dual(el),
                                    )}
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );
                                            if (
                                                Math.hypot(
                                                    fd.nx,
                                                    fd.ny,
                                                    fd.nz,
                                                ) > 0 &&
                                                fd.radius > 0
                                            ) {
                                                const nc = cga.circle(
                                                    [
                                                        1 * fd.x,
                                                        1 * fd.y,
                                                        1 * fd.z,
                                                    ],
                                                    1 * fd.radius,
                                                    [
                                                        1 * fd.nx,
                                                        1 * fd.ny,
                                                        1 * fd.nz,
                                                    ],
                                                );

                                                if (cga.isCircle(nc)) {
                                                    elements[eli].el =
                                                        cga.undual(nc);
                                                }
                                            }
                                        }}
                                    >
                                        <div
                                            style="display: grid; gap: 1ex; grid-template-columns: 1fr 1fr;"
                                        >
                                            <label
                                                class="form-row"
                                                style:grid-column="1 / -1"
                                            >
                                                Radius:
                                                <input
                                                    type="range"
                                                    name="radius"
                                                    value={cirParams.radius}
                                                    min="0"
                                                    max="1"
                                                    step="0.001"
                                                />
                                            </label>
                                            <div>
                                                <label class="form-row">
                                                    X:
                                                    <input
                                                        type="range"
                                                        name="x"
                                                        value={cirParams
                                                            .center[0]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Y:
                                                    <input
                                                        type="range"
                                                        name="y"
                                                        value={cirParams
                                                            .center[1]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Z:
                                                    <input
                                                        type="range"
                                                        name="z"
                                                        value={cirParams
                                                            .center[2]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                            </div>
                                            <div>
                                                <label class="form-row">
                                                    NX:
                                                    <input
                                                        type="range"
                                                        name="nx"
                                                        value={cirParams
                                                            .normal[0]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    NY:
                                                    <input
                                                        type="range"
                                                        name="ny"
                                                        value={cirParams
                                                            .normal[1]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    NZ:
                                                    <input
                                                        type="range"
                                                        name="nz"
                                                        value={cirParams
                                                            .normal[2]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                {:else if cga.isLine(el)}
                                    <strong>Line</strong>
                                    {@const lineParams = cga.lineParameters(el)}
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );
                                            const nl = cga.line(
                                                [fd.px, fd.py, fd.pz],
                                                [fd.dx, fd.dy, fd.dz],
                                            );
                                            if (cga.isLine(nl)) {
                                                elements[eli].el = nl;
                                            }
                                        }}
                                    >
                                        <div
                                            style="display: grid; gap: 1ex; grid-template-columns: 1fr 1fr;"
                                        >
                                            <div>
                                                Point
                                                <label class="form-row">
                                                    X:
                                                    <input
                                                        type="range"
                                                        name="px"
                                                        value={lineParams
                                                            .point[0]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Y:
                                                    <input
                                                        type="range"
                                                        name="py"
                                                        value={lineParams
                                                            .point[1]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Z:
                                                    <input
                                                        type="range"
                                                        name="pz"
                                                        value={lineParams
                                                            .point[2]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                            </div>
                                            <div>
                                                Direction
                                                <label class="form-row">
                                                    X:
                                                    <input
                                                        type="range"
                                                        name="dx"
                                                        value={lineParams
                                                            .direction[0]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Y:
                                                    <input
                                                        type="range"
                                                        name="dy"
                                                        value={lineParams
                                                            .direction[1]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Z:
                                                    <input
                                                        type="range"
                                                        name="dz"
                                                        value={lineParams
                                                            .direction[2]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                {:else if cga.isLine(cga.dual(el))}
                                    <strong>Line (Dual)</strong>
                                    {@const lineParams = cga.lineParameters(
                                        cga.dual(el),
                                    )}
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );
                                            const nl = cga.line(
                                                [fd.px, fd.py, fd.pz],
                                                [fd.dx, fd.dy, fd.dz],
                                            );
                                            if (cga.isLine(nl)) {
                                                elements[eli].el =
                                                    cga.undual(nl);
                                            }
                                        }}
                                    >
                                        <div
                                            style="display: grid; gap: 1ex; grid-template-columns: 1fr 1fr;"
                                        >
                                            <div>
                                                Point
                                                <label class="form-row">
                                                    X:
                                                    <input
                                                        type="range"
                                                        name="px"
                                                        value={lineParams
                                                            .point[0]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Y:
                                                    <input
                                                        type="range"
                                                        name="py"
                                                        value={lineParams
                                                            .point[1]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Z:
                                                    <input
                                                        type="range"
                                                        name="pz"
                                                        value={lineParams
                                                            .point[2]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                            </div>
                                            <div>
                                                Direction
                                                <label class="form-row">
                                                    X:
                                                    <input
                                                        type="range"
                                                        name="dx"
                                                        value={lineParams
                                                            .direction[0]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Y:
                                                    <input
                                                        type="range"
                                                        name="dy"
                                                        value={lineParams
                                                            .direction[1]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                                <label class="form-row">
                                                    Z:
                                                    <input
                                                        type="range"
                                                        name="dz"
                                                        value={lineParams
                                                            .direction[2]}
                                                        min="-1"
                                                        max="1"
                                                        step="0.01"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                {:else if cga.isEuclideanPoint(el)}
                                    {@const p = cga.pointParameters(el)}
                                    <strong>Point</strong>
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );
                                            const np = cga.pointReflection(
                                                fd.x,
                                                fd.y,
                                                fd.z,
                                                1 * fd.sign,
                                            );
                                            if (cga.isEuclideanPoint(np))
                                                elements[eli].el = np;
                                        }}
                                    >
                                        <label class="form-row">
                                            X:
                                            <input
                                                type="range"
                                                name="x"
                                                value={p.x}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Y:
                                            <input
                                                type="range"
                                                name="y"
                                                value={p.y}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Z:
                                            <input
                                                type="range"
                                                name="z"
                                                value={p.z}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <input
                                            type="hidden"
                                            name="sign"
                                            value="1"
                                        />
                                        <label class="form-row">
                                            negative:
                                            <input
                                                type="checkbox"
                                                name="sign"
                                                value="-1"
                                                checked={p.sign < 0}
                                            />
                                        </label>
                                    </form>
                                {:else if cga.isEuclideanPoint(cga.dual(el))}
                                    {@const p = cga.pointParameters(
                                        cga.dual(el),
                                    )}
                                    <strong>Point (Dual)</strong>
                                    <form
                                        oninput={(evt) => {
                                            const fd = Object.fromEntries(
                                                new FormData(evt.currentTarget),
                                            );
                                            const np = cga.pointReflection(
                                                fd.x,
                                                fd.y,
                                                fd.z,
                                                1 * fd.sign,
                                            );
                                            if (cga.isEuclideanPoint(np))
                                                elements[eli].el =
                                                    cga.undual(np);
                                        }}
                                    >
                                        <label class="form-row">
                                            X:
                                            <input
                                                type="range"
                                                name="x"
                                                value={p.x}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Y:
                                            <input
                                                type="range"
                                                name="y"
                                                value={p.y}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <label class="form-row">
                                            Z:
                                            <input
                                                type="range"
                                                name="z"
                                                value={p.z}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                        <input
                                            type="hidden"
                                            name="sign"
                                            value="1"
                                        />
                                        <label class="form-row">
                                            negative:
                                            <input
                                                type="checkbox"
                                                name="sign"
                                                value="-1"
                                                checked={p.sign < 0}
                                            />
                                        </label>
                                    </form>
                                {:else}
                                    <strong>None</strong>
                                    <p>
                                        This element does not have a simple
                                        interpretation.
                                    </p>
                                    <p>
                                        Not every element CGA can be interpreted
                                        as a simple geometric shape acting as a
                                        reflector.
                                    </p>
                                {/if}
                            </div>
                        </details>
                        {#snippet basisSlider(eli, basis)}
                            <label class="slider-with-value">
                                <span>{basis}</span>
                                <input
                                    type="range"
                                    value={elements[eli].el[
                                        cga.basisIndex[basis]
                                    ]}
                                    min={-2}
                                    max={2}
                                    step={0.01}
                                    oninput={(evt) => {
                                        elements[eli].el = cga.setBasis(
                                            elements[eli].el,
                                            cga.basisIndex[basis],
                                            evt.currentTarget.valueAsNumber,
                                        );
                                    }}
                                />
                                <output>
                                    {formatter.format(
                                        elements[eli].el[cga.basisIndex[basis]],
                                    )}
                                </output>
                            </label>
                        {/snippet}

                        <details
                            class="accordeon-item"
                            bind:open={accordeons.planelike}
                        >
                            <summary>Plane-like components</summary>
                            <div
                                style="display: grid; grid-template-columns: 1fr 1fr; gap: 1ex"
                            >
                                <fieldset>
                                    <legend>Grade 1</legend>
                                    {@render basisSlider(eli, "e1")}
                                    {@render basisSlider(eli, "e2")}
                                    {@render basisSlider(eli, "e3")}
                                </fieldset>
                                <fieldset>
                                    <legend>Grade 4</legend>
                                    {@render basisSlider(eli, "e23pm")}
                                    {@render basisSlider(eli, "e13pm")}
                                    {@render basisSlider(eli, "e12pm")}
                                </fieldset>
                            </div>
                        </details>
                        <details
                            class="accordeon-item"
                            bind:open={accordeons.spherelike}
                        >
                            <summary>Sphere-like components</summary>
                            <div
                                style="display: grid; grid-template-columns: 1fr 1fr; gap: 1ex"
                            >
                                <fieldset>
                                    <legend>Grade 1</legend>
                                    {@render basisSlider(eli, "ep")}
                                    {@render basisSlider(eli, "em")}
                                    <label
                                        style="display: flex; flex-direction: column;"
                                    >
                                        <span style:white-space="nowrap"
                                            >(ep + em) / 2</span
                                        >
                                        <input
                                            type="range"
                                            value={(elements[eli].el[
                                                cga.basisIndex.ep
                                            ] +
                                                elements[eli].el[
                                                    cga.basisIndex.em
                                                ]) /
                                                2}
                                            min={-2}
                                            max={2}
                                            step={0.01}
                                            oninput={(evt) => {
                                                const old =
                                                    (elements[eli].el[
                                                        cga.basisIndex.ep
                                                    ] +
                                                        elements[eli].el[
                                                            cga.basisIndex.em
                                                        ]) /
                                                    2;
                                                const dep =
                                                    elements[eli].el[
                                                        cga.basisIndex.ep
                                                    ] - old;
                                                const dem =
                                                    elements[eli].el[
                                                        cga.basisIndex.em
                                                    ] - old;

                                                elements[eli].el = cga.setBasis(
                                                    cga.setBasis(
                                                        elements[eli].el,
                                                        cga.basisIndex.ep,
                                                        evt.currentTarget
                                                            .valueAsNumber +
                                                            dep,
                                                    ),
                                                    cga.basisIndex.em,
                                                    evt.currentTarget
                                                        .valueAsNumber + dem,
                                                );
                                            }}
                                        />
                                    </label>
                                    <label
                                        style="display: flex; flex-direction: column;"
                                    >
                                        <span style:white-space="nowrap"
                                            >(ep - em)</span
                                        >
                                        <br />
                                        <input
                                            type="range"
                                            value={elements[eli].el[
                                                cga.basisIndex.ep
                                            ] -
                                                elements[eli].el[
                                                    cga.basisIndex.em
                                                ]}
                                            min={-5}
                                            max={5}
                                            step={0.01}
                                            oninput={(evt) => {
                                                const old =
                                                    (elements[eli].el[
                                                        cga.basisIndex.ep
                                                    ] +
                                                        elements[eli].el[
                                                            cga.basisIndex.em
                                                        ]) /
                                                    2;

                                                elements[eli].el = cga.setBasis(
                                                    cga.setBasis(
                                                        elements[eli].el,
                                                        cga.basisIndex.ep,
                                                        old +
                                                            evt.currentTarget
                                                                .valueAsNumber /
                                                                2,
                                                    ),
                                                    cga.basisIndex.em,
                                                    old -
                                                        evt.currentTarget
                                                            .valueAsNumber /
                                                            2,
                                                );
                                            }}
                                        />
                                    </label>
                                </fieldset>
                                <fieldset>
                                    <legend>Grade 4</legend>
                                    {@render basisSlider(eli, "e123m")}
                                </fieldset>
                            </div>
                        </details>
                        <details
                            class="accordeon-item"
                            bind:open={accordeons.linelike}
                        >
                            <summary>Line-line components</summary>
                            <div
                                style="display: grid; grid-template-columns: 1fr 1fr; gap: 1ex"
                            >
                                <fieldset>
                                    <legend>Grade 2</legend>
                                    {@render basisSlider(eli, "e13")}
                                    {@render basisSlider(eli, "e23")}
                                    {@render basisSlider(eli, "e12")}
                                </fieldset>
                                <fieldset>
                                    <legend>Grade 3</legend>
                                    {@render basisSlider(eli, "e3pm")}
                                    {@render basisSlider(eli, "e2pm")}
                                    {@render basisSlider(eli, "e1pm")}
                                </fieldset>
                            </div>
                        </details>
                        <details
                            class="accordeon-item"
                            bind:open={accordeons.pointlike}
                        >
                            <summary>Point-like components</summary>
                            <div
                                style="display: grid; grid-template-columns: 1fr 1fr; gap: 1ex"
                            >
                                <fieldset>
                                    <legend>Grade 3</legend>
                                    {@render basisSlider(eli, "e123")}
                                </fieldset>
                                <fieldset>
                                    <legend>Grade 2</legend>
                                    {@render basisSlider(eli, "epm")}
                                </fieldset>
                            </div>
                        </details>
                        <details
                            class="accordeon-item"
                            bind:open={accordeons.pointpairlike}
                        >
                            <summary>Point Pair-like components</summary>
                            <div
                                style="display: grid; grid-template-columns: 1fr 1fr; gap: 1ex"
                            >
                                <fieldset>
                                    <legend>Grade 2</legend>
                                    {@render basisSlider(eli, "e1m")}
                                    {@render basisSlider(eli, "e2m")}
                                    {@render basisSlider(eli, "e3m")}
                                </fieldset>
                                <fieldset>
                                    <legend>Grade 3</legend>
                                    {@render basisSlider(eli, "e23p")}
                                    {@render basisSlider(eli, "e13p")}
                                    {@render basisSlider(eli, "e12p")}
                                </fieldset>
                            </div>
                        </details>
                        <details
                            class="accordeon-item"
                            bind:open={accordeons.circlelike}
                        >
                            <summary>Circle-like components</summary>
                            <div
                                style="display: grid; grid-template-columns: 1fr 1fr; gap: 1ex"
                            >
                                <fieldset>
                                    <legend>Grade 2</legend>
                                    {@render basisSlider(eli, "e1p")}
                                    {@render basisSlider(eli, "e2p")}
                                    {@render basisSlider(eli, "e3p")}
                                </fieldset>
                                <fieldset>
                                    <legend>Grade 3</legend>
                                    {@render basisSlider(eli, "e23m")}
                                    {@render basisSlider(eli, "e13m")}
                                    {@render basisSlider(eli, "e12m")}
                                </fieldset>
                            </div>
                        </details>
                        <details
                            class="accordeon-item"
                            bind:open={accordeons.identitylike}
                        >
                            <summary>Identity-like components</summary>
                            <div
                                style="display: grid; grid-template-columns: 1fr 1fr; gap: 1ex"
                            >
                                <fieldset>
                                    <legend>Grade 0</legend>
                                    {@render basisSlider(eli, "scalar")}
                                </fieldset>
                                <fieldset>
                                    <legend>Grade 5</legend>
                                    {@render basisSlider(eli, "e123pm")}
                                </fieldset>
                            </div>
                        </details>
                    </div>
                </div>
            {:else}
                <div class="empty-box">
                    <strong>No transformations added yet.</strong>

                    <p>You have created any transformations yet.</p>
                    <p>
                        Add some element (eg. a reflection plane) to observe how
                        the 3d object on the right gets transformed.
                    </p>
                    <p>
                        The simplest transformations are plane and sphere
                        reflections. More complex transformations can be
                        composed from simpler ones.
                    </p>
                    <p>
                        Any possible transformation can be encoded as a tuple of <code
                        >
                            32</code
                        >
                        (ie. 2<sup>5</sup>) elements.
                    </p>
                    <p>
                        <a href="https://bivector.net/tools.html?p=4&q=1&r=0"
                            >Conformal Geometric Algebra</a
                        > defines rules for how these tuples are to be combined via
                        addition and multiplication to achieve the desired geometric
                        transformation.
                    </p>

                    <fieldset class="fieldset-sub">
                        <legend>Add your first transformation</legend>
                        <div class="button-row centered">
                            <button
                                disabled={freeColors.length < 1}
                                onclick={(evt) => {
                                    elements.push({
                                        color: freeColors.shift(),
                                        active: true,
                                        el: cga.plane([1, 0, 0], 0),
                                    });
                                }}
                                >reflection at the <code>e1</code> plane</button
                            >
                            <button
                                disabled={freeColors.length < 1}
                                onclick={(evt) => {
                                    elements.push({
                                        color: freeColors.shift(),
                                        active: true,
                                        el: cga.ep,
                                    });
                                }}
                                >reflection at the <code>ep</code> unit sphere</button
                            >
                        </div>
                    </fieldset>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .app {
        display: grid;
        grid-template-columns: 0 [menu-start] 2fr [menu-end viewport-start toolbar-start] 2fr 2fr [viewport-end toolbar-end] 0;
        grid-template-rows: 0 [menu-start viewport-start] 1fr 1fr 1fr [toolbar-start viewport-end] auto [menu-end toolbar-end] 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        gap: 1em;
    }
    .toolbar {
        grid-area: toolbar;
        z-index: 100;
        display: flex;
        gap: 1ex;

        color: #fff;
        font-size: 0.7rem;
        padding: 1ex;
        background-color: #0008;
        overflow: auto;
    }
    .menu {
        user-select: none;
        grid-area: menu;
        background-color: #0008;
        color: #fff;
        z-index: 1;
        max-height: 100%;
        overflow: hidden;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto auto;
        grid-auto-rows: 1fr;
        font-size: smaller;
    }
    header {
        padding: 1ex;
    }
    input[type="range"] {
        width: 100%;
        flex-grow: 1;
    }
    h1 {
        margin: 0;
        font-size: 1.2em;
    }
    .block-list {
        align-self: start;
        display: flex;
        flex-direction: column;
        gap: 1ex;
        max-height: 100%;
        overflow: auto;
        box-sizing: border-box;
        padding: 1ex;
        margin-bottom: 1ex;
    }
    .block-list::after {
        content: " ";
        display: block;
        height: 2em;
    }
    .element {
        user-select: none;
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr;
        flex-direction: row;
        accent-color: var(--color);
        border: 1px solid var(--color);
        background: rgb(from var(--color) r g b / 10%);
        padding: 1ex;
        gap: 1ex;
    }
    .element-side {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 2em;
        flex-direction: column;
        gap: 2px;
        text-align: center;
        grid-column: 1 / span 1;
        grid-row: 1 / span 2;
    }

    .element-head {
        user-select: none;
        display: flex;
        gap: 1ex;
        grid-column: 2 / span 1;
        grid-row: 1 / span 1;
    }
    .form-checkbox {
        display: flex;
        align-items: center;
        font-size: smaller;
    }
    input[type="color"] {
        padding: 0;
        width: 3.5ex;
        height: 3.5ex;
        margin: 0;
        border: none;
    }
    input {
        font-family: monospace, monospace;
    }
    .viewport {
        background-color: #a000;
        grid-area: viewport;
        z-index: 100;
        pointer-events: none;
    }
    .screen {
        grid-area: 1 / 1 / -1 / -1;
        z-index: 0;
    }

    :global(html) {
        height: 100%;
    }
    :global(body) {
        margin: 0;
        font-family: monospace, monospace;
        height: 100%;
        display: grid;
        grid-template-columns: 100%;
        grid-template-rows: 100%;
    }
    label {
        display: flex;
    }

    .form-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1ex;
    }
    input[type="range"] {
        flex-grow: 1;
    }
    .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1ex;
        padding: 1ex;
    }

    button {
        border: none;
        background-color: #222;
        border-radius: 0;
        color: #fff;
        padding: 0.5ex 1ex;
        display: block;
        cursor: pointer;
        font: inherit;
    }
    .menu a {
        color: inherit;
    }
    [draggable] {
        cursor: hand;
        background-color: #222;
        color: #fff;
        align-items: center;
    }
    [draggable]:hover {
        color: royalblue;
    }
    .dragging {
        opacity: 0.2;
    }
    .hover {
        outline: 3px solid gold;
    }
    button:disabled {
        cursor: default;
        opacity: 0.3;
    }
    .fieldset-mini {
        padding: 0;
    }
    .fieldset-sub legend {
        margin: auto;
        background-color: transparent;
        color: #fff;
        text-align: center;
    }
    .fieldset-sub {
        margin-top: 1ex;
        border: none;
        padding: 0;
    }
    .element-button {
        text-align: center;
        justify-content: center;
        padding: 1ex;
        display: flex;
        box-sizing: border-box;
        align-items: center;
    }
    .serialized {
        opacity: 1;
        outline: none;
        background-color: #fff;
        border: 1px solid #333;
        width: 100%;
        user-select: all;
        resize: none;
        box-sizing: border-box;
    }
    legend {
        font-size: small;
        background-color: #333;
        margin-left: 1ex;
        padding: 0.2ex 0.5ex;
        white-space: nowrap;
        font-size: smaller;
    }
    button {
        white-space: nowrap;
    }
    fieldset {
        border: 1px solid #333;
        padding: 0.5ex;
        margin: 0;
    }
    details {
        width: 100%;
        box-sizing: border-box;
    }
    summary {
        background-color: #111;
        color: #fff;
        padding: 1ex;
        font-size: smaller;

        box-sizing: border-box;
    }

    .texticon {
        width: 1em;
        height: 1em;
        vertical-align: center;
    }
    label:has(input[type="checkbox"]) {
        display: flex;
        align-items: center;
        background-color: #333a;
        padding: 0.5ex;
    }
    .accordeon {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .accordeon-item:open::details-content {
        padding: 1ex;
    }
    .gridset {
        border: none;
        padding: 0;
        display: grid;
        margin: 0;
        grid-column: 1 / span 2;
        grid-template-columns: subgrid;
        gap: 2px;
    }
    .gridset legend {
        grid-column: 1 / -1;
        display: block;
        justify-self: center;
        position: static;
        width: 100%;
        margin: 0;
        inset: none;
        box-sizing: border-box;
        border: none;
        margin-bottom: 2px;
    }
    textarea {
        padding: 1ex;
    }
    .empty-box {
        padding: 1ex;
        border: 2px solid #333a;
        background-color: #3333;
    }
    .centered {
        justify-content: center;
    }
    button code {
        font-weight: bold;
        font-size: inherit;
        font: inherit;
    }
    .slider-with-value {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
    }
    .slider-with-value span {
        grid-row: 1 / span 1;
        grid-column: 1 / span 1;
    }
    .slider-with-value input {
        grid-column: 1 / -1;
        grid-row: 2 / span 1;
    }
    .slider-with-value output {
        grid-column: 2 / -1;
        grid-row: 1 / span 1;
        justify-self: end;
    }
</style>
