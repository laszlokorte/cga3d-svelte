<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";
    import * as cga from "./cga3";
    let viewport = $state();
    let scene = $state();
    let freeColors = $state([
        "gold",
        "tomato",
        "teal",
        "limegreen",
        "royalblue",
    ]);

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
            elements.reduce((a, b) => cga.wedge(b.el, a), cga.scalar(1)),
        ),
    );
    const summedMotor = $derived(
        cga.normalize(
            elements.reduce((a, b) => cga.add(b.el, a), cga.scalar(0)),
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
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 1.0891029675340143, 0, 0, 0, 0, 0, 0,
                        0.09307263694569601, 0, 0, 0, 0, 0, 0, 0,
                        1.093072636945696, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0,
                    ],
                },
                {
                    color: "teal",
                    active: true,
                    el: [
                        0, -1.1376184679875454, 0, 0, 0, 0, 0, 0,
                        0.14708788935315986, 0, 0, 0, 0, 0, 0, 0,
                        1.1470878893531598, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0,
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
                {
                    color: "tomato",
                    active: true,
                    el: [
                        0, 0, 0.6283371070876214, 0, 0.7779411802037217, 0, 0,
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 0, 0, 0,
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
            name: "Quad-Spheres",
            showVectorField: true,
            elements: [
                {
                    color: "teal",
                    active: true,
                    el: [
                        0, 0.14, -0.3857232671671479, 0, -0.7936569589243941, 0,
                        0, 0, -0.012663096358391857, 0, 0, 0, 0, 0, 0, 0,
                        0.9873369036416081, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0,
                    ],
                },
                {
                    color: "tomato",
                    active: true,
                    el: [
                        0, 0.13643666094813728, 0.22, 0, -0.7936359875182499, 0,
                        0, 0, -0.2356134784326273, 0, 0, 0, 0, 0, 0, 0,
                        0.7643865215673727, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0,
                    ],
                },
                {
                    color: "gold",
                    active: true,
                    el: [
                        0, -0.5046413841383113, 0, 0, 0, 0, 0, 0,
                        -0.8726685367074869, 0, 0, 0, 0, 0, 0, 0,
                        0.1273314632925131, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0,
                    ],
                },
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 0.7482625938840345, -0.0036697412166969423, 0, 0, 0,
                        0, 0, -0.7200448117966695, 0, 0, 0, 0, 0, 0, 0,
                        0.27995518820333054, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0,
                    ],
                },
            ],
        },

        {
            name: "Smoke Rings",

            showVectorField: true,
            elements: [
                {
                    color: "royalblue",
                    active: true,
                    el: [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.1365, 0, 0.2725, 0, 0,
                        0, 0, 0, 0.1635, 0, -0.2275, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0,
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
            freeColors.push(elements.pop().color);
        }
        for (let e = 0; e < ex.elements.length; e++) {
            elements.push({
                ...ex.elements[e],
                el: new Float64Array(
                    Object.keys(ex.elements[e].el)
                        .sort((a, b) => a - b)
                        .map((k) => ex.elements[e].el[k]),
                ),
                color: freeColors.pop() || ex.elements[e].color,
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
                    wedged={wedgedMotor && cga.isVersor(wedgedMotor)
                        ? wedgedMotor
                        : cga.scalar(1)}
                    motor={combinedMotor}
                    bind:this={scene}
                />
            </Canvas>

            {#snippet pending()}

            {/snippet}
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
            <legend>Add Plane</legend>
            <div class="button-row">
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.plane([1, 0, 0], 0),
                        });
                    }}>e1</button
                >
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.plane([0, 1, 0], 0),
                        });
                    }}>e2</button
                >
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.plane([0, 0, 1], 0),
                        });
                    }}>e3</button
                >
            </div>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Point</legend>
            <div class="button-row">
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.pointReflection(0, 0.0, 0.0),
                        });
                    }}>Add Point</button
                >
            </div>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Sphere</legend>
            <div class="button-row">
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.sphere(0, 0, 0, 1),
                        });
                    }}>r1</button
                >
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.sphere(0, 0, 0, 0),
                        });
                    }}>r0</button
                >
            </div>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Point Pair</legend>
            <div class="button-row">
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.pointPair(
                                cga.zeroSphere(-0.5, 0.0, 0.0),
                                cga.zeroSphere(0.5, 0.0, 0.0),
                            ),
                        });
                    }}>e1</button
                >
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.pointPair(
                                cga.zeroSphere(0.0, -0.5, 0.0),
                                cga.zeroSphere(0.0, 0.5, 0.0),
                            ),
                        });
                    }}>e2</button
                >
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.pointPair(
                                cga.zeroSphere(0.0, 0.0, -0.5),
                                cga.zeroSphere(0.0, 0.0, 0.5),
                            ),
                        });
                    }}>e3</button
                >
            </div>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>Add Circle</legend>
            <div class="button-row">
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.circle([0, 0, 0], 1, [1, 0, 0]),
                        });
                    }}>e1</button
                >
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.circle([0, 0, 0], 1, [0, 1, 0]),
                        });
                    }}>e2</button
                >
                <button
                    disabled={freeColors.length < 1}
                    onclick={(evt) => {
                        elements.push({
                            color: freeColors.pop(),
                            active: true,
                            el: cga.circle([0, 0, 0], 1, [0, 0, 1]),
                        });
                    }}>e3</button
                >
            </div>
        </fieldset>
        <fieldset class="fieldset-mini">
            <legend>All</legend>
            <div class="button-row">
                <button
                    disabled={elements.length == 0}
                    onclick={(evt) => {
                        while (elements.length) {
                            freeColors.push(elements.pop().color);
                        }
                    }}>Clear</button
                >
                <button
                    disabled={elements.length == 0}
                    onclick={(evt) => {
                        elements = elements.map((e) => {
                            return { ...e, el: cga.dual(e.el) };
                        });
                    }}>Dual all</button
                >
                <button
                    disabled={elements.length == 0}
                    onclick={(evt) => {
                        elements = elements.map((e) => {
                            return { ...e, el: cga.scale(-1, e.el) };
                        });
                    }}
                    >Negate all
                </button>
                <button
                    disabled={elements.length == 0}
                    onclick={(evt) => {
                        elements = elements.toReversed();
                    }}>Reverse</button
                >

                <button
                    disabled={!combinedMotor || !cga.isVersor(combinedMotor)}
                    onclick={(evt) => {
                        const cmb = combinedMotor;
                        while (elements.length) {
                            freeColors.push(elements.pop().color);
                        }
                        elements.push({
                            active: true,
                            color: freeColors.pop(),
                            el: cmb,
                        });
                    }}>gp all</button
                >
                <button
                    disabled={!wedgedMotor || !cga.isVersor(wedgedMotor)}
                    onclick={(evt) => {
                        const cmb = wedgedMotor;
                        while (elements.length) {
                            freeColors.push(elements.pop().color);
                        }
                        elements.push({
                            active: true,
                            color: freeColors.pop(),
                            el: cmb,
                        });
                    }}>&wedge; all</button
                >
                <button
                    disabled={!summedMotor}
                    onclick={(evt) => {
                        const cmb = summedMotor;
                        while (elements.length) {
                            freeColors.push(elements.pop().color);
                        }
                        elements.push({
                            active: true,
                            color: freeColors.pop(),
                            el: cmb,
                        });
                    }}>sum all</button
                >
            </div>
        </fieldset>
    </div>
    <div class="menu">
        <header>
            <h1>3D Conformal Transformations (WIP)</h1>
            <p style:font-size="smaller">
                inspired by
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
                <legend>Options</legend>
                <div class="button-row">
                    <div class="button-row">
                        <label
                            ><input
                                type="checkbox"
                                bind:checked={showVectorField}
                            /> Show Vector Field</label
                        >
                        <label
                            ><input
                                type="checkbox"
                                bind:checked={showIntersections}
                            /> Show Intersections</label
                        >
                        <label
                            ><input type="checkbox" bind:checked={showObject} /> Show
                            Example Object</label
                        >
                    </div>
                </div>
            </fieldset>

            <details>
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
                <legend>All</legend>
                <div class="button-row">
                    <button
                        disabled={elements.length == 0}
                        onclick={(evt) => {
                            while (elements.length) {
                                freeColors.push(elements.pop().color);
                            }
                        }}>Clear</button
                    >
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
                                    color: freeColors.pop(),
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
                                color: freeColors.pop(),
                                active: false,
                            });
                        } else if (from.type == "cga-gp" && freeColors.length) {
                            elements.push({
                                el: cga.gp(
                                    elements[to].el,
                                    elements[fromIndex].el,
                                ),

                                color: freeColors.pop(),
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
                                color: freeColors.pop(),
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
                                color: freeColors.pop(),
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
                        <button
                            class="element-button"
                            onclick={(evt) => {
                                freeColors.push(color);
                                elements = elements.filter((_, i) => i !== eli);
                            }}
                        >
                            &cross;
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
                        >
                            ☰
                        </div>
                        <button
                            class="element-button"
                            onclick={(evt) => {
                                elements[eli].el = cga.dual(elements[eli].el);
                            }}
                        >
                            Dual
                        </button>
                        <button
                            class="element-button"
                            onclick={(evt) => {
                                elements[eli].el = cga.undual(elements[eli].el);
                            }}
                        >
                            Undual
                        </button>
                        <button
                            class="element-button"
                            onclick={(evt) => {
                                elements[eli].el = cga.scale(
                                    -1,
                                    elements[eli].el,
                                );
                            }}
                        >
                            Negate
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
                            {cga.isCircle(el) ? "circle" : ""}
                            {cga.isEuclideanPoint(el) ? "euclid" : ""}
                            {cga.isPointPair(el) ? "pair" : ""}
                            {cga.isPlane(el) ? "plane" : ""}
                            {cga.isSphere(el) ? "sphere" : ""}
                            {cga.isCircle(cga.dual(el)) ? "circle" : ""}
                            {cga.isEuclideanPoint(cga.dual(el)) ? "euclid" : ""}
                            {cga.isPointPair(cga.dual(el)) ? "pair" : ""}
                            {cga.isPlane(cga.dual(el)) ? "plane" : ""}
                            {cga.isSphere(cga.dual(el)) ? "sphere" : ""}
                        </label>
                        <label class="form-checkbox">
                            <input
                                type="checkbox"
                                bind:checked={elements[eli].active}
                            />
                            Active
                        </label>
                    </div>
                    <div>
                        {#if cga.isSphere(el)}
                            <strong>Sphere</strong>
                            {@const sphCoords = cga.sphereParameters(el)}
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
                            </form>
                        {:else if cga.isSphere(cga.dual(el))}
                            <strong>Sphere (Dual)</strong>
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
                            </form>
                        {:else if cga.isPlane(el)}
                            <strong>Plane</strong>
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
                            <strong>Plane (Dual)</strong>
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
                                            [1 * fd.x, 1 * fd.y, 1 * fd.z],
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
                                            new FormData(evt.currentTarget),
                                        );

                                        const npp = cga.pointPair(
                                            cga.zeroSphere(fd.x, fd.y, fd.z),
                                            cga.zeroSphere(b.x, b.y, b.z),
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
                                            new FormData(evt.currentTarget),
                                        );

                                        const npp = cga.pointPair(
                                            cga.zeroSphere(a.x, a.y, a.z),
                                            cga.zeroSphere(fd.x, fd.y, fd.z),
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
                            {@const [b, a] = cga.pointPairCoords(cga.dual(el))}
                            <div
                                style="display: grid; grid-template-columns: 1fr 1fr"
                            >
                                <form
                                    oninput={(evt) => {
                                        const fd = Object.fromEntries(
                                            new FormData(evt.currentTarget),
                                        );

                                        const npp = cga.pointPair(
                                            cga.zeroSphere(b.x, b.y, b.z),
                                            cga.zeroSphere(fd.x, fd.y, fd.z),
                                        );
                                        if (cga.isPointPair(npp))
                                            elements[eli].el = cga.undual(npp);
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
                                            new FormData(evt.currentTarget),
                                        );

                                        const npp = cga.pointPair(
                                            cga.zeroSphere(fd.x, fd.y, fd.z),
                                            cga.zeroSphere(a.x, a.y, a.z),
                                        );
                                        if (cga.isPointPair(npp))
                                            elements[eli].el = cga.undual(npp);
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
                            {@const cirParams = cga.circleParameters(el)}

                            <form
                                oninput={(evt) => {
                                    const fd = Object.fromEntries(
                                        new FormData(evt.currentTarget),
                                    );
                                    if (
                                        Math.hypot(fd.nx, fd.ny, fd.nz) > 0 &&
                                        fd.radius > 0
                                    ) {
                                        const nc = cga.circle(
                                            [1 * fd.x, 1 * fd.y, 1 * fd.z],
                                            1 * fd.radius,
                                            [1 * fd.nx, 1 * fd.ny, 1 * fd.nz],
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
                                                value={cirParams.center[0]}
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
                                                value={cirParams.center[1]}
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
                                                value={cirParams.center[2]}
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
                                                value={cirParams.normal[0]}
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
                                                value={cirParams.normal[1]}
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
                                                value={cirParams.normal[2]}
                                                min="-1"
                                                max="1"
                                                step="0.01"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </form>
                        {:else if cga.isCircle(cga.dual(el))}
                            <strong>Circle (Dual)</strong>
                            {@const cirParams = cga.circleParameters(
                                cga.dual(el),
                            )}
                            <form
                                oninput={(evt) => {
                                    const fd = Object.fromEntries(
                                        new FormData(evt.currentTarget),
                                    );
                                    if (
                                        Math.hypot(fd.nx, fd.ny, fd.nz) > 0 &&
                                        fd.radius > 0
                                    ) {
                                        const nc = cga.circle(
                                            [1 * fd.x, 1 * fd.y, 1 * fd.z],
                                            1 * fd.radius,
                                            [1 * fd.nx, 1 * fd.ny, 1 * fd.nz],
                                        );

                                        if (cga.isCircle(nc)) {
                                            elements[eli].el = cga.undual(nc);
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
                                                value={cirParams.center[0]}
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
                                                value={cirParams.center[1]}
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
                                                value={cirParams.center[2]}
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
                                                value={cirParams.normal[0]}
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
                                                value={cirParams.normal[1]}
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
                                                value={cirParams.normal[2]}
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
                                                value={lineParams.point[0]}
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
                                                value={lineParams.point[1]}
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
                                                value={lineParams.point[2]}
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
                                                value={lineParams.direction[0]}
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
                                                value={lineParams.direction[1]}
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
                                                value={lineParams.direction[2]}
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
                                                value={lineParams.point[0]}
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
                                                value={lineParams.point[1]}
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
                                                value={lineParams.point[2]}
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
                                                value={lineParams.direction[0]}
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
                                                value={lineParams.direction[1]}
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
                                                value={lineParams.direction[2]}
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
                                    if (
                                        cga.isEuclideanPoint(np) &&
                                        !cga.isPointPair(cga.dual(np))
                                    )
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
                                <input type="hidden" name="sign" value="1" />
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
                            {@const p = cga.pointParameters(cga.dual(el))}
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
                                    if (
                                        cga.isEuclideanPoint(np) &&
                                        !cga.isPointPair(cga.dual(np))
                                    )
                                        elements[eli].el = cga.undual(np);
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
                                <input type="hidden" name="sign" value="1" />
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
                            <strong>Unknown</strong>
                        {/if}
                        <textarea
                            class="serialized"
                            readonly
                            style:user-select="all">{cga.toString(el)}</textarea
                        >
                    </div>
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

        color: #fff;
        padding: 1ex;
        background-color: #0008;
        font-size: smaller;
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
        display: flex;
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
    .element-button {
        text-align: center;
        justify-content: center;
        padding: 1ex;
        display: flex;
    }
    .serialized {
        opacity: 1;
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
    }
    details {
        width: 100%;
        box-sizing: border-box;
    }
    summary {
        background-color: #111;
        color: #fff;
        padding: 1ex;

        box-sizing: border-box;
    }

    .texticon {
        width: 1em;
        height: 1em;
        vertical-align: center;
    }
</style>
