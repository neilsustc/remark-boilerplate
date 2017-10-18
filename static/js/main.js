function loadFromUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                source = xhr.responseText.replace(/\r\n/g, '\n');
                if (typeof callback === 'function') {
                    callback(source);
                }
            } else {
                throw Error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        throw Error(xhr.statusText);
    };
    xhr.send(null);
    return xhr;
}

function abbrAuthor(author) {
    splits = author.trim().split(' ');
    for (var i = 0; i < splits.length; i++) {
        if (i !== splits.length - 1) {
            splits[i] = splits[i][0];
        } else {
            splits[i] = ' ' + splits[i];
        }
    }
    return splits.join('').trim();
}

function renderAuthor(author) {
    authors = author.replace('and', '').trim().split(',');
    if (authors.length === 1) {
        return abbrAuthor(author);
    } else {
        return abbrAuthor(authors[0]) + ' et al.';
    }
}

function renderReference(source) {
    regex = /^@{(.*?)}{(.*?)}{(.*?)}{(.*?)}{(.*?)}$/;
    refLines = source.split(/\r?\n/g).filter(line => regex.test(line));
    refList = refLines.map(line => {
        matches = regex.exec(line);
        return {
            line: matches[0],
            id: matches[1],
            author: matches[2],
            title: matches[3],
            publisher: matches[4],
            year: matches[5]
        }
    });

    /* Render `\cite{}` */
    source = source.replace(/\\cite{(.*?)}/g, (_, p1) => {
        items = refList.filter(item => item.id == p1);
        if (items.length !== 0) {
            return `([${renderAuthor(items[0].author)}, ${items[0].year}](#${items[0].id}))`;
        } else {
            return '<span style="color: red;">(Error parsing \\cite)</span>';
        }
    });

    /* Render bibliography */
    refList.forEach(item => {
        source = source.replace(item.line, `<p id="${item.id}" class="ref-item">${item.author}. ${item.title}. <em>${item.publisher}</em>. ${item.year}.</p>`);
    });

    return source;
}

loadFromUrl('content.md', source => {
    source = renderReference(source);
    document.getElementById('source').innerHTML = source;
    var slideshow = remark.create();
});

/* Render math */
setTimeout(function () {
    mathDoms = document.getElementsByClassName('math');
    for (var i = 0; i < mathDoms.length; i++) {
        var element = mathDoms[i];
        katex.render(element.innerHTML, element);
    }
}, 500);