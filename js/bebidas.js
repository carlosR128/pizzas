(function(){
    const tabs = document.querySelectorAll('.tab-btn');
    const alcohol = document.getElementById('alcoholSection');
    const tabBebidas = document.getElementById('tab-bebidas');

    function setActiveTab(target){
        tabs.forEach(t=> t.classList.toggle('active', t.dataset.target===target));
        if(target === 'tab-bebidas'){
            if(tabBebidas) tabBebidas.classList.remove('hidden');
            if(alcohol) alcohol.classList.add('hidden');
        } else if(target === 'alcoholSection'){
            if(tabBebidas) tabBebidas.classList.add('hidden');
            if(alcohol) alcohol.classList.remove('hidden');
            if(alcohol) alcohol.scrollIntoView({behavior:'smooth'});
        }
    }

    tabs.forEach(t=> t.addEventListener('click', ()=> setActiveTab(t.dataset.target)));

    // initial state
    setActiveTab('tab-bebidas');
})();
