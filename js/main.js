const POKE_API_BASIC_URL = 'https://pokeapi.co/api/v2/pokemon/';
const cardImg = document.getElementById('card-img');
const cardName = document.getElementById('card-name');
const cardHeight = document.getElementById('card-height');
const cardHp = document.getElementById('card-hp');
const cardWeight = document.getElementById('card-weight');
const cardTypes = document.getElementById('card-type');
const errorSearch = document.getElementById('error');
const searchForm = document.getElementById('search-form');
const searchFormInput = document.getElementById('search-form-input');
const suggestions = document.getElementById('suggestion-list');
const suggestionsGroup = document.getElementById('suggestion');
const KEYS_CODES = { arrowDown: "ArrowDown", arrowUp: "ArrowUp", enter: "Enter", esc: "Escape" };
let allNames = [];

function getAllPokemonNames() {
    fetch('https://pokeapi.co/api/v2/pokemon/?limit=1118')
        .then(response => response.json())
        .then(pokemonObj => {
            allNames = pokemonObj.results.map(obj => obj.name);
        })
        .catch(err => {
            loaderDisplay('hide');
        });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function loaderDisplay(action) {
    if (action === 'show') {
        document.getElementById('loader').classList.add('loader--active');
    } else if (action === 'hide') {
        document.getElementById('loader').classList.remove('loader--active');
    }
}

function cardDisplay(action) {
    if (action === 'show') {
        document.getElementById('card').classList.add('card--active');
    } else if (action === 'hide') {
        document.getElementById('card').classList.remove('card--active');
    }
}

function removeSuggestions() {
    suggestions.classList.remove('suggestion--active');
    suggestions.innerHTML = '';
    searchFormInput.setAttribute('aria-expanded', 'false');
}

function showSuggestion() {
    suggestions.classList.add('suggestion--active');
    searchFormInput.setAttribute('aria-expanded', 'true');
}

function getCurrentSuggestionActive() {
    return Array.from(suggestions.querySelectorAll('li')).indexOf(suggestions.querySelector('li.suggestion__name'));
}

function isFormValid() {
    return !searchForm.classList.contains('search-form--invalid');
}

const onInputSearchForm = debounce(() => {
    const inputValue = searchFormInput.value.trim().toLowerCase();
    let suggestionNames = allNames
        .filter(name => name.toLowerCase().includes(inputValue))
        .map(pokemon => {
            if (pokemon.indexOf(inputValue) < 1) {
                return pokemon.replace(inputValue, "<strong>" + capitalizeFirstLetter(inputValue) + "</strong>");
            } else {
                return pokemon.replace(inputValue, "<strong>" + inputValue + "</strong>");
            }
        });

    if (inputValue.length >= 1 && !isFormValid()) {
        setFormTo('valid');
        if (suggestionNames.length < 1) {
            removeSuggestions();
            errorSearch.innerHTML = 'Ops ! Parece que ' + inputValue + ' não existe<br>:(';
            errorSearch.classList.add('error--active');
        }
        return;
    }

    if (inputValue.length < 3) {
        errorSearch.classList.remove('error--active');
        removeSuggestions();

        return;
    }


    if (suggestionNames.length >= 1) {
        errorSearch.innerHTML = '';
        errorSearch.classList.remove('error--active');
        showSuggestion();
        suggestions.innerHTML = '';
        suggestionNames.forEach((el, i) => {
            const itemName = document.createElement('li');

            itemName.addEventListener('click', (e) => {
                searchFormInput.value = itemName.innerText;
                removeSuggestions();
                searchPokemon(e);
            });
            itemName.setAttribute('role', 'option');
            itemName.id = `suggestion-${i}`;
            itemName.innerHTML = capitalizeFirstLetter(el);
            itemName.classList.add('suggestion__item');
            suggestions.appendChild(itemName);
        });

    } else {
        removeSuggestions();
        errorSearch.innerHTML = 'Ops ! Parece que ' + inputValue + ' não existe<br>:(';
        errorSearch.classList.add('error--active');
    }
}, 500);

function setFormTo(state) {
    let action;

    if (state === 'valid') action = 'remove';
    else if (state === 'invalid') action = 'add';

    searchForm.classList[action]('search-form--invalid');
    searchFormInput.parentElement.classList[action]('search-form__group--invalid');
}

function searchPokemon(e) {
    removeSuggestions();
    e.preventDefault();

    const inputValue = searchFormInput.value.trim().toLowerCase();
    const form = e.currentTarget;

    errorSearch.classList.remove('error--active');

    if (inputValue === '') {
        setFormTo('invalid');

        return;
    }
    const endpoint = POKE_API_BASIC_URL + inputValue + '/';

    form.classList.remove('search-form--invalid');
    searchFormInput.parentElement.classList.remove('search-form__group--invalid');
    cardDisplay('hide');
    loaderDisplay('show');
    searchFormInput.value = '';


    fetch(endpoint)
        .then(response => response.json())
        .then(pokemonObj => {
            errorSearch.classList.remove('error--active');
            cardTypes.innerHTML = '';
            pokemonObj.types.forEach(type => {
                const cardType = document.createElement('li');

                cardType.innerText = type.type.name.toUpperCase();
                cardType.classList.add('card__type');
                cardType.classList.add('card__type--' + type.type.name);
                cardTypes.appendChild(cardType);
            });
            let height = pokemonObj.height.toString().split("");

            if (height.length === 1) {
                cardHeight.innerText = "0." + pokemonObj.height;
            } else {
                cardHeight.innerText = pokemonObj.height;
            }

            cardName.innerText = capitalizeFirstLetter(pokemonObj.name);
            if (pokemonObj.sprites.front_default) {
                cardImg.src = pokemonObj.sprites.front_default;
            } else {
                cardImg.src = "img/pokeball.png";
            }
            cardHp.innerText = pokemonObj.stats[0].base_stat;
            cardWeight.innerText = pokemonObj.weight;
        })
        .catch(err => {
            loaderDisplay('hide');
            errorSearch.innerHTML = err;
            errorSearch.classList.add('error--active');
        });

};

cardImg.addEventListener('load', () => {
    loaderDisplay('hide');
    cardDisplay('show');
});

searchFormInput.addEventListener('input', onInputSearchForm);

function manageComboboxScroll(newSuggestionActive) {
    let pokemonSuggestion = suggestions.querySelectorAll('li');
    let optionHeight = pokemonSuggestion[newSuggestionActive].offsetHeight;
    let optionTop = pokemonSuggestion[newSuggestionActive].offsetTop;
    let listScrollTop = suggestions.scrollTop;
    let listHeight = suggestions.offsetHeight;
    let optionBottom = (optionTop - listScrollTop) + optionHeight;

    if (optionBottom < optionHeight || optionBottom > listHeight) {
        suggestions.scrollTop = (listScrollTop + optionBottom) - optionHeight;
    }
}

searchFormInput.addEventListener('keydown', (e) => {
    let pokemonSuggestion = suggestions.querySelectorAll('li');
    let currentSuggestionActive = getCurrentSuggestionActive();

    switch (e.key) {
        case KEYS_CODES.arrowUp:
            if (currentSuggestionActive != -1) {
                if (currentSuggestionActive != 0) {
                    const newSuggestionActive = currentSuggestionActive - 1;

                    pokemonSuggestion[currentSuggestionActive].classList.remove('suggestion__name');
                    pokemonSuggestion[newSuggestionActive].classList.add('suggestion__name');
                    searchFormInput.setAttribute('aria-activedescendant', 'suggestion-' + newSuggestionActive);

                    manageComboboxScroll(newSuggestionActive);
                }
            }

            break;

        case KEYS_CODES.arrowDown:

            if (currentSuggestionActive != -1) {

                if (pokemonSuggestion.length - 1 !== currentSuggestionActive) {
                    const newSuggestionActive = currentSuggestionActive + 1;

                    pokemonSuggestion[currentSuggestionActive].classList.remove('suggestion__name');
                    pokemonSuggestion[newSuggestionActive].classList.add('suggestion__name');
                    searchFormInput.setAttribute('aria-activedescendant', 'suggestion-' + newSuggestionActive);
                    manageComboboxScroll(newSuggestionActive);
                }
            } else {
                searchFormInput.setAttribute('aria-activedescendant', 'suggestion-' + 0);
                pokemonSuggestion[0].classList.add('suggestion__name');
            }

            break;

        case KEYS_CODES.enter:

            if (currentSuggestionActive != -1) {

                removeSuggestions();
                searchFormInput.value = pokemonSuggestion[currentSuggestionActive].innerText;
            }
            break;

        case KEYS_CODES.esc:
            searchFormInput.value = '';
            removeSuggestions();

            break;

        default:
            break;
    }
});

searchForm.addEventListener('submit', searchPokemon)

getAllPokemonNames();