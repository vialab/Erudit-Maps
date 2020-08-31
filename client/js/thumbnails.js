"use strict";
// Start of use strict

const vw = $("#map").width()
const vh = $("#map").height()

const tw = 455
const th = 256
// const ratio = 2
const ratiow = vw / tw
const ratioh = vh / th

var thumbMaps = []
var thumbList = [] // flat, links to keys in thumbnails

var thumbnailData = new Map()
var thumbnails = new Map()

var thumbPage = 1
var thumbFilter = {
    active: false,
    activeThumb: null,
    oldMyData: {},
}
var activeFilters = new Map();
var activePages = new Map();

const cardContainer = $('#thumbnail-cards')
function initThumbnails() {
    let thumb
    for (let id = 0; id < 6; id++) {
        thumb = new Thumbnail(id)
    }


    let resizeListener = thumb.map.addListener("tilesloaded", _ => {
        $('#map').attr("style", `height: calc(100vh - ${$('#thumbnail-cards').parent().height()}px)`)
        google.maps.event.removeListener(resizeListener)
    })

    $('#filter-left').click(function (event) {
        thumbPage = Math.max(1, thumbPage - 1)
        clearThumbnails()
        drawThumbnails()
    })
    $('#filter-right').click(function (event) {
        thumbPage = Math.min(Math.ceil(thumbList.length / 6), thumbPage + 1)
        clearThumbnails()
        drawThumbnails()
    })
    $('#clear-thumbs').click(function (event) {
        activeFilters = new Map()
        thumbnails.forEach((value, key) => {
            value.setActive(false)
        })

        let new_data = filter_data
        updateDataFunction(new_data)
        updateMapFunction(new_data, true)
        renderAppliedFilter()
        thumbFilter.active = false
    })
}

function addThumbnail(key, data, colour) {
    thumbnailData.set(key, [data, colour])
}

function applyThumbnailFilters() {
    if (activeFilters.size > 0) {
        renderBuffer.getFrontBuffer().forEach((value, key) => value.setMap(null))

        let documents = []
        for (let [key, ids] of activeFilters) {
            setsToRender.push([ids])

            let docTmp = $.grep(filter_data.documents, function (doc, i) {
                let keep = true
                if (ids.length > 1) {
                    ids.forEach((entityid, id) => {
                        if ($.inArray(entityid, doc.links) == -1) {
                            keep = false
                        }
                    })
                } else {
                    return (ids[0] == doc.entityid) && (doc.links.length === 1)
                }
                return keep
            })
            // documents.push(docTmp)
            documents = $.merge(documents, docTmp)
        }
        // filter links such that both documents are in selected journals
        var entities = getEntityList(documents);
        var new_data = { documents: documents, entities: entities };
        // update(new_data)
        updateDataFunction(new_data)
        updateMapFunction(new_data, true)
        renderRequestedSets()
    } else {
        let new_data = filter_data
        updateDataFunction(new_data)
        updateMapFunction(new_data, true)
    }
}

function setThumbnailFilters(thumbNail) {


    if (thumbNail && thumbNail.active) {
        activePages.set(thumbPage, Math.min(6, activePages.get(thumbPage) + 1))

        let ids = []
        thumbNail.key.split(',').forEach(v => {
            ids.push(Number(v))
        })
        activeFilters.set(thumbNail.key, ids)
        applyThumbnailFilters()
    } else {
        activePages.set(thumbPage, Math.max(0, activePages.get(thumbPage) - 1))
        activeFilters.delete(thumbNail.key)

        if (activeFilters.size > 0) {
            applyThumbnailFilters()
        } else {
            let new_data = filter_data
            updateDataFunction(new_data)
            updateMapFunction(new_data, true)
            renderAppliedFilter()
            thumbFilter.active = false
        }
    }
}

function drawThumbnails() {
    clearThumbnails()

    const filterLeft = $('#filter-left');
    const filterRight = $('#filter-right');

    let startId = (thumbPage - 1) * 6
    if (thumbPage === 1) {
        filterLeft.hide()
    } else {
        filterLeft.show()
    }
    if ((startId + 6) >= thumbList.length) {
        filterRight.hide()
    } else {
        filterRight.show()
    }

    filterLeft.removeClass("thumbnail-active")
    filterRight.removeClass("thumbnail-active")

    for (let page = 0; page < Math.ceil(thumbList.length / 6); page++) {
        let activeOffPage = activePages.get(page) > 0

        if (activeOffPage) {
            if (page < thumbPage) {
                filterLeft.addClass("thumbnail-active")
            } else if (page > thumbPage) {
                filterRight.addClass("thumbnail-active")
            }
        }
    }

    for (let id = startId; id < (startId + 6); id++) {
        let key = thumbList[id];
        const thumbMap = thumbMaps[id - startId]

        if (key && thumbnailData.get(key)) {
            thumbMap.show()
            thumbMap.setBubbleSet(key)
            if (activeFilters.get(key)) {
                thumbMap.setActive(true)
            } else {
                thumbMap.setActive(false)
            }

        } else {
            thumbMap.hide()
        }
    }
}

function clearThumbnails() {
    thumbnails.forEach((value, key) => {
        thumbnails.delete(key)
        value.clearBubbleSet()
    })
}

function resetThumbnails() {
    clearThumbnails()
    // thumbList = [] // flat, links to keys in thumbnails
    thumbnailData = new Map()
    thumbnails = new Map()
}


class Thumbnail {
    constructor(id, parent) {
        this.active = false
        this.id = id
        this.parent = parent

        this.createMap()
    }

    show() {
        $(this.parent).show()
    }
    hide() {
        $(this.parent).hide()
    }

    createMap() {
        $('#filter-right').before(`<div class="ui card" style="width: auto; margin: .625em .35em">
        <div class="content transition overflow" style="padding: 0px 0px">
          <div class="thumbnail-container" id="bubblethumb-${this.id}">
          </div></div></div>`)

        this.parent = $(`#bubblethumb-${this.id}`).parent().parent()
        this.map = new google.maps.Map(document.getElementById(`bubblethumb-${this.id}`), {
            zoom: map.zoom,
            center: new google.maps.LatLng(55, -72),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            // scaleControl: false,
            streetViewControl: false,
            // zoomControl: false,
            clickableIcons: false,
            // disableDefaultUI: true,
            // disableDoubleClickZoom: true,
            // draggable: false,
            // draggableCursor: false,
            // draggingCursor: false,
            fullscreenControl: false,
            styles: map.styles
        });
        thumbMaps.push(this)

        this.overlay = new google.maps.OverlayView();
        this.overlay.onAdd = _ => {

            this.overlay.layer = d3
                .select(this.overlay.getPanes().overlayMouseTarget)
                .append("div")
                .attr("class", "stations");

            this.layer = d3
                .select(this.overlay.getPanes().overlayLayer)
                .append("div")
                .attr("class", "SvgOverlay");
            this.svg = this.layer.append("svg");
            this.projection = this.overlay.getProjection();
        }
        this.overlay.draw = function () { };
        // Bind our overlay to the map
        this.overlay.onRemove = function () {
            this.layer.remove();
        };
        this.overlay.setMap(this.map)
    }

    setBubbleSet(key) {
        this.key = key
        const bubbleData = thumbnailData.get(key)
        this.bubbleSet = new google.maps.Polygon({
            path: bubbleData[0],
            strokeColor: "#000000",
            strokeOpacity: 0.5,
            strokeWeight: bubbleSetOutlineThickness,
            fillColor: bubbleData[1],
            fillOpacity: bubbleSetOpacity,
            geodesic: false
        })

        if (thumbnails.get(key)) {
            thumbnails.delete(key)
            this.clearBubbleSet()
        }

        thumbnails.set(key, this)

        this.bubbleSet.setMap(this.map)
        this.fitMapToBubble()

        this.addSetMarkers()
        this.setMouseEvent()
    }
    clearBubbleSet() {
        this.bubbleSet.setMap(null)
    }

    addSetMarkers() {
        const projection = this.overlay.getProjection()
        const setEntities = []

        this.key.split(',').forEach((value, i) => {
            if (filter_data.entities.hasOwnProperty(value)) {
                setEntities.push(filter_data.entities[value])
            }
        })

        const transform = function (d) {
            node_coord[d.entityid] = [d.lat, d.lng];
            d = new google.maps.LatLng(d.lat, d.lng);
            d = projection.fromLatLngToDivPixel(d);
            return d3
                .select(this)
                .style("left", d.x - padding + "px")
                .style("top", d.y - padding + "px")
                .style("z-index", 99);
        }

        this.overlay.draw = _ => {
            this.overlay.layer
                .selectAll("svg")
                .data(setEntities)
                .each(transform);
        }

        this.overlay.layer.selectAll("svg").remove();
        let marker = this.overlay.layer
            .selectAll("svg")
            .data(setEntities)
            .each(transform) // update existing markers
            .enter()
            .append("svg")
            .each(transform)
            .attr("class", "marker")
            .attr("doc-id", function (d) {
                return d.entityid;
            })
            .attr("journal-id", function (d) {
                return d.entityid;
            })

        marker
            .append("circle")
            .attr("r", 4.5)
            .attr("cx", padding)
            .attr("cy", padding)
            .attr("fill", function (d) {
                return rgb_highlight(d.entityid);
            })
            .attr("stroke", function (d) {
                if (rgb_highlight(d.entityid) != rgb_default) {
                    return "#000";
                } else {
                    return rgb_stroke;
                }
            });
    }

    fitMapToBubble() {
        let bounds = new google.maps.LatLngBounds()
        this.bounds = bounds
        this.bubbleSet.getPath().forEach((value, key) => {
            bounds.extend(value)
        })
        this.map.fitBounds(bounds, { top: 16, right: 16, bottom: 16, left: 16 })
    }

    setActive(active) {
        this.active = active
        if (activePages.get(thumbPage) === undefined) {
            activePages.set(thumbPage, 0)
        }
        if (active) {
            this.parent.addClass("thumbnail-active")
        } else {
            this.parent.removeClass("thumbnail-active")
        }
    }
    toggleActive() {
        this.setActive(!this.active)
    }

    setMouseEvent() {
        this.parent.off("click")
        this.parent.click((event) => {
            if ($(event.target).is("button")) {
                return
            }
            this.toggleActive()

            if (this.active) {
                map.setCenter(this.bounds.getCenter())
            }
            setThumbnailFilters(this)
        })
    }

}