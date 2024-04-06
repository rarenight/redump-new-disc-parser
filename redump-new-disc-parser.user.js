// ==UserScript==
// @name         Redump New Disc Form Parser
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Tampermonkey userscript that auto-inputs MPF output (the values in !submissionInfo.txt) into Redump's New Disc form
// @author       rarenight
// @match        http://redump.org/newdisc/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let commonInfo = {};
    let subInfo = {
        versions_and_editions: {},
        extras: {},
        size_and_checksums: {}
    };
    let commonInfo2 = subInfo.common_disc_info;

    function replaceOptional(value) {
        return value.replace(/\(OPTIONAL\)/g, "");
    }

    function fillForm(selector, value) {
        let element = document.querySelector(selector);
        if (element && value !== undefined) {
            element.value = replaceOptional(value);
        }
    }
    function parseInput() {
        const input = document.getElementById('inputText').value;

        commonInfo.d_title = (input.match(/Title: (.+)/) || [])[1];
        commonInfo.d_title_foreign = (input.match(/Foreign Title \(Non-latin\): (.+)/) || [])[1];
        commonInfo.d_serial = (input.match(/Disc Serial: (.+)/) || [])[1];
        commonInfo.d_barcode = (input.match(/Barcode: (.+)/) || [])[1];
        commonInfo.d_date = (input.match(/EXE\/Build Date: (.+)/) || [])[1];
        subInfo.extras.d_pvd = (input.match(/Primary Volume Descriptor \(PVD\):\n\n((\d{4} : .+\n)+)/) || [])[1];

        let versionSection = input.split('Version and Editions:')[1];
        if (versionSection) {
            subInfo.versions_and_editions.d_version = (versionSection.match(/Version: (.+)/) || [])[1];
        }
        let ringCodeRegex = /Ringcode Information:\n([\s\S]*?)(?=\n\tBarcode:|\n\n)/;
        let ringCodeMatch = input.match(ringCodeRegex);
        let ringInfo = ringCodeMatch ? ringCodeMatch[1].trim() : '';

        let commentsRegex = /Comments:\s*([\s\S]*?)(?=\n\s*Contents:|\n\t\w+:|$)/;
        let commentsMatch = input.match(commentsRegex);
        let comments = commentsMatch ? commentsMatch[1].trim() : '';

        fillForm('#d_title', commonInfo.d_title);
        if (commonInfo.d_title_foreign) {
            fillForm('#d_title_foreign', commonInfo.d_title_foreign);
        }
        fillForm('#d_serial', commonInfo.d_serial);
        fillForm('#d_barcode', commonInfo.d_barcode);
        fillForm('#d_date', commonInfo.d_date);
        fillForm('#d_version', subInfo.versions_and_editions.d_version);
        fillForm('#d_pvd', subInfo.extras.d_pvd);
        fillForm('#d_ring_wip', ringInfo);
        fillForm('#d_comments', comments);

        let edc = (input.match(/EDC: (Yes|No)/) || [])[1];
        if (edc === 'Yes') {
            document.querySelector('#d_edc_1').checked = true;
        } else if (edc === 'No') {
            document.querySelector('#d_edc_0').checked = true;
        }

        let errorCount = (input.match(/Error Count: (\d+)/) || [])[1];
        if (errorCount !== undefined) {
            fillForm('#d_errors', errorCount);
        }

        let antiModchip = (input.match(/Anti-modchip: (Yes|No)/) || [])[1];
        if (antiModchip === 'Yes') {
            document.querySelector('#d_protection_a_1').checked = true;
        } else if (antiModchip === 'No') {
            document.querySelector('#d_protection_a_0').checked = true;
        }

        let libCrypt = (input.match(/LibCrypt: No/) || [])[0];
        if (libCrypt) {
            document.querySelector('#d_libcrypt_no_0').checked = true;
        }
        
        let editionMatch = (input.match(/Edition\/Release: (.+)/) || [])[1];
        if (editionMatch) {
            if (/Original/.test(editionMatch.trim())) {
                document.querySelector('#d_editions_0').checked = true;
            } else {
                document.getElementById('d_editions_text').value = editionMatch.trim();
            }
        }
/*
      if (document.querySelector('input[value="' + subInfo2.versions_and_editions.d_editions_text + '"]')) {
        checkBySelector('input[name="d_editions[]"][value="' + subInfo2.versions_and_editions.d_editions_text + '"]');
      } else {
         fillForm('#d_editions_text', subInfo2.versions_and_editions.d_editions_text);
      }
*/
        function checkBySelector(cssSelector) {
            if (!document.querySelector(cssSelector)){
                console.log('Redump Reimagined || Error: CSS selector "' + cssSelector + '" doesn\'t match any element on the page!');
            } else {
                document.querySelector(cssSelector).checked = true;
            }
        }

    const currentUrl = window.location.href;
    const isTargetPage = currentUrl.includes('http://redump.org/newdisc/PSX/') || currentUrl.includes('http://redump.org/newdisc/PS2_CD/');

    if (isTargetPage) {
        let writeOffsetMatch = input.match(/Write Offset: ([+-]?\d+)/);
        if (writeOffsetMatch) {
            let writeOffset = writeOffsetMatch[1];
            switch(writeOffset) {
                case '+2':
                    document.querySelector('#d_offset_0').checked = true;
                    break;
                case '+1':
                    document.querySelector('#d_offset_1').checked = true;
                    break;
                case '-12':
                    document.querySelector('#d_offset_2').checked = true;
                    break;
                case '-572':
                    document.querySelector('#d_offset_3').checked = true;
                    break;
                case '-647':
                    document.querySelector('#d_offset_4').checked = true;
                    break;
                default:
                    fillForm('#d_offset_text', writeOffset);
            }
        }
    }


    const regionToRadioIdMap = {
        "Argentina": "d_region_0",
        "Asia": "d_region_1",
        "Asia, Europe": "d_region_2",
        "Asia, USA": "d_region_3",
        "Australia": "d_region_4",
        "Australia, Germany": "d_region_5",
        "Australia, New Zealand": "d_region_6",
        "Austria": "d_region_7",
        "Austria, Switzerland": "d_region_8",
        "Belarus": "d_region_9",
        "Belgium": "d_region_10",
        "Belgium, Netherlands": "d_region_11",
        "Brazil": "d_region_12",
        "Bulgaria": "d_region_13",
        "Canada": "d_region_14",
        "China": "d_region_15",
        "Croatia": "d_region_16",
        "Czech": "d_region_17",
        "Denmark": "d_region_18",
        "Estonia": "d_region_19",
        "Europe": "d_region_20",
        "Europe, Asia": "d_region_21",
        "Europe, Australia": "d_region_22",
        "Europe, Canada": "d_region_23",
        "Europe, Germany": "d_region_24",
        "Export": "d_region_25",
        "Finland": "d_region_26",
        "France": "d_region_27",
        "France, Spain": "d_region_28",
        "Germany": "d_region_29",
        "Greater China": "d_region_30",
        "Greece": "d_region_31",
        "Hungary": "d_region_32",
        "Iceland": "d_region_33",
        "India": "d_region_34",
        "Ireland": "d_region_35",
        "Israel": "d_region_36",
        "Italy": "d_region_37",
        "Japan": "d_region_38",
        "Japan, Asia": "d_region_39",
        "Japan, Europe": "d_region_40",
        "Japan, Korea": "d_region_41",
        "Japan, USA": "d_region_42",
        "Korea (Republic of Korea)": "d_region_43",
        "Latin America": "d_region_44",
        "Lithuania": "d_region_45",
        "Netherlands": "d_region_46",
        "New Zealand": "d_region_47",
        "Norway": "d_region_48",
        "Poland": "d_region_49",
        "Portugal": "d_region_50",
        "Romania": "d_region_51",
        "Russia": "d_region_52",
        "Scandinavia": "d_region_53",
        "Serbia": "d_region_54",
        "Singapore": "d_region_55",
        "Slovakia": "d_region_56",
        "South Africa": "d_region_57",
        "Spain": "d_region_58",
        "Spain, Portugal": "d_region_59",
        "Sweden": "d_region_60",
        "Switzerland": "d_region_61",
        "Taiwan": "d_region_62",
        "Thailand": "d_region_63",
        "Turkey": "d_region_64",
        "United Arab Emirates": "d_region_65",
        "UK": "d_region_66",
        "UK, Australia": "d_region_67",
        "Ukraine": "d_region_68",
        "USA": "d_region_69",
        "USA, Asia": "d_region_70",
        "USA, Australia": "d_region_71",
        "USA, Brazil": "d_region_72",
        "USA, Canada": "d_region_73",
        "USA, Europe": "d_region_74",
        "USA, Germany": "d_region_75",
        "USA, Japan": "d_region_76",
        "USA, Korea": "d_region_77",
        "World": "d_region_78"
    };

        let regionMatch = input.match(/Region: (.+)/);
        if (regionMatch) {
            let region = regionMatch[1].trim();
            let radioId = regionToRadioIdMap[region];

            if (radioId) {
                document.getElementById(radioId).checked = true
            }
        }

    const languageToCheckboxIdMap = {
        "Afrikaans": "d_languages_0",
        "Albanian": "d_languages_1",
        "Arabic": "d_languages_2",
        "Armenian": "d_languages_3",
        "Basque": "d_languages_4",
        "Belarusian": "d_languages_5",
        "Bulgarian": "d_languages_6",
        "Catalan": "d_languages_7",
        "Chinese": "d_languages_8",
        "Croatian": "d_languages_9",
        "Czech": "d_languages_10",
        "Danish": "d_languages_11",
        "Dutch": "d_languages_12",
        "English": "d_languages_13",
        "Estonian": "d_languages_14",
        "Finnish": "d_languages_15",
        "French": "d_languages_16",
        "Gaelic": "d_languages_17",
        "German": "d_languages_18",
        "Greek": "d_languages_19",
        "Hebrew": "d_languages_20",
        "Hindi": "d_languages_21",
        "Hungarian": "d_languages_22",
        "Icelandic": "d_languages_23",
        "Indonesian": "d_languages_24",
        "Italian": "d_languages_25",
        "Japanese": "d_languages_26",
        "Korean": "d_languages_27",
        "Latin": "d_languages_28",
        "Latvian": "d_languages_29",
        "Lithuanian": "d_languages_30",
        "Macedonian": "d_languages_31",
        "Norwegian": "d_languages_32",
        "Polish": "d_languages_33",
        "Portuguese": "d_languages_34",
        "Punjabi": "d_languages_35",
        "Romanian": "d_languages_36",
        "Russian": "d_languages_37",
        "Serbian": "d_languages_38",
        "Slovak": "d_languages_39",
        "Slovenian": "d_languages_40",
        "Spanish": "d_languages_41",
        "Swedish": "d_languages_42",
        "Tamil": "d_languages_43",
        "Thai": "d_languages_44",
        "Turkish": "d_languages_45",
        "Ukrainian": "d_languages_46",
        "Vietnamese": "d_languages_47"
    };

        let languagesMatch = input.match(/Languages: (.+)/);
        if (languagesMatch) {
            let languages = languagesMatch[1].split(',').map(lang => lang.trim());

            languages.forEach(language => {
                let checkboxId = languageToCheckboxIdMap[language];
                if (checkboxId) {
                    document.getElementById(checkboxId).checked = true;
                }
            });
        }

        let tracksAndOffsetsSection = input.match(/Tracks and Write Offsets:[\s\S]*?(?=\n\nDumping Info:|$)/);
        if (tracksAndOffsetsSection) {
            let tracksAndOffsetsRegex = /DAT:\s*([\s\S]*?)(?=\n\s*Cuesheet)/;
            let tracksAndOffsetsMatch = input.match(tracksAndOffsetsRegex);
            let tracksAndOffsets = tracksAndOffsetsMatch ? tracksAndOffsetsMatch[1].trim() : '';

            if (tracksAndOffsets) {
                fillForm('#d_tracks', tracksAndOffsets);
            }

            let cueSheetMatch = tracksAndOffsetsSection[0].match(/Cuesheet:\n\n([\s\S]*?)(?=\n\n|$)/);
            if (cueSheetMatch && cueSheetMatch[1]) {
                fillForm('#d_cue', cueSheetMatch[1].trim());
            }
        }
        subInfo.size_and_checksums.d_size = (input.match(/Size: (.+)/) || [])[1];
        subInfo.size_and_checksums.d_crc32 = (input.match(/CRC32: (.+)/) || [])[1];
        subInfo.size_and_checksums.d_md5 = (input.match(/MD5: (.+)/) || [])[1];
        subInfo.size_and_checksums.d_sha1 = (input.match(/SHA1: (.+)/) || [])[1];

        fillForm('#d_size', subInfo.size_and_checksums.d_size);
        fillForm('#d_crc32', subInfo.size_and_checksums.d_crc32);
        fillForm('#d_md5', subInfo.size_and_checksums.d_md5);
        fillForm('#d_sha1', subInfo.size_and_checksums.d_sha1);
    }

    function addInputElements() {
        const container = document.createElement('div');
        container.style.margin = '10px';

        const textarea = document.createElement('textarea');
        textarea.id = "inputText";
        textarea.rows = 10;
        textarea.cols = 80;
        container.appendChild(textarea);

        const parseButton = document.createElement('button');
        parseButton.innerText = "Parse";
        parseButton.onclick = parseInput;
        container.appendChild(parseButton);

        const body = document.body;
        body.insertBefore(container, body.firstChild);
    }

    window.addEventListener('load', addInputElements);
})();
