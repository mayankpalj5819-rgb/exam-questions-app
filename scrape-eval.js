var qlinks = document.querySelectorAll('a[href*="/past-years/jee/question/"]');
var res = [];
qlinks.forEach(function(lnk, idx) {
  var txt = lnk.innerText || '';
  var hr = lnk.getAttribute('href') || '';
  var im = [];
  lnk.querySelectorAll('img').forEach(function(ig) {
    var sr = ig.getAttribute('src') || '';
    if (sr && !sr.includes('avatar') && !sr.includes('favicon') && sr.length > 20) im.push(sr);
  });
  var ym = txt.match(/JEE (?:Main|Advanced).*?(\d{4})/);
  var yr = ym ? parseInt(ym[1]) : 0;
  var sh = '';
  if (txt.includes('Morning Shift')) sh = 'Morning Shift';
  else if (txt.includes('Evening Shift')) sh = 'Evening Shift';
  var lns = txt.split('\n').map(function(l){return l.trim()}).filter(Boolean);
  var yi = lns.findIndex(function(l){return l.includes('JEE')});
  var qt = yi > 0 ? lns.slice(1, yi).join(' ') : (lns.length > 1 ? lns.slice(1).join(' ') : '');
  res.push({y:yr, s:sh, t:qt.substring(0,3000), im:im, h:hr});
});
JSON.stringify(res);