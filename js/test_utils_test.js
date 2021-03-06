// Copyright 2012 Google Inc.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License.  You may obtain a copy
// of the License at: http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distrib-
// uted under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, either express or implied.  See the License for
// specific language governing permissions and limitations under the License.


goog.require('cm.Analytics');

function TestUtilsTest() {
  cm.TestBase.call(this);
}
TestUtilsTest.prototype = new cm.TestBase();
registerTestSuite(TestUtilsTest);

/** Tests construction of a FakeElement. */
TestUtilsTest.prototype.fakeElementConstructor = function() {
  var element = new FakeElement('div', {'id': 'abc', 'class': 'xyz'});
  expectEq('DIV', element.nodeName);
  expectEq('abc', element.id);
  expectEq('xyz', element.className);
  expectEq(element, FakeElement.elementsById_['abc']);
};

/** Exercises FakeElement.appendChild(). */
TestUtilsTest.prototype.fakeElementAppendChild = function() {
  var parent = new FakeElement('div');
  var child1 = new FakeElement('img');
  var child2 = new FakeElement('p');
  parent.appendChild(child1);
  expectEq(parent, child1.parentNode);
  expectEq(1, parent.childNodes.length);
  expectEq(child1, parent.childNodes[0]);

  parent.appendChild(child2);
  expectEq(parent, child2.parentNode);
  expectEq(2, parent.childNodes.length);
  expectEq(child2, parent.childNodes[1]);
  expectEq(child2, child1.nextSibling);
  expectEq(child1, child2.previousSibling);

  parent.appendChild('ABC');
  expectEq(3, parent.childNodes.length);
  expectEq('ABC', parent.childNodes[2]);
  expectEq('ABC', child2.nextSibling);
};

/** Exercises FakeUi.getText() with both innerHTML and child text nodes. */
TestUtilsTest.prototype.uiTestGetText = function() {
  var element = new FakeElement('div');
  element.innerHTML = 'dogs &amp; <i>cats</i>';
  expectEq('dogs & cats', FakeUi.getText(element));
  element = new FakeElement('div');
  var textNode = new FakeElement('#text');
  textNode.textContent = 'dogs &amp; cats';
  element.appendChild(textNode);
  expectEq('dogs &amp; cats', FakeUi.getText(element));
};

/** Verifies that FakeUi.create() creates a proper DOM hierarchy. */
TestUtilsTest.prototype.uiTestCreate = function() {
  var element = FakeUi.create('div', {'id': 'a'},
      FakeUi.create('ul', {}, FakeUi.create('li', {}, 'one')),
      FakeUi.create('ol', {}, FakeUi.create('li', {}, 'two')),
      null,
      FakeUi.create('div', cm.Html.fromSanitizedHtml('abc')));
  expectEq(3, element.childNodes.length);
  expectEq('UL', element.childNodes[0].nodeName);
  expectEq('OL', element.childNodes[1].nodeName);
  expectEq(
      'one', element.childNodes[0].childNodes[0].childNodes[0].textContent);
};

/** Verifies that FakeElement.toString() draws a nice DOM tree. */
TestUtilsTest.prototype.fakeElementToString = function() {
  var element = FakeUi.create('div', {'id': 'a'},
      FakeUi.create('ul', {}, FakeUi.create('li', {}, 'one')),
      FakeUi.create('ol', {}, FakeUi.create('li', {}, 'two')));
  // Make sure that class name changes are reflected on {@code toString()}.
  element.className = 'xyz';
  expectEq('\n<DIV id="a" class="xyz">' +
           '\n|-<UL>' +
           '\n| \'-<LI>' +
           '\n|   \'-"one"' +
           '\n\'-<OL>' +
           '\n  \'-<LI>' +
           '\n    \'-"two"', element.toString());
};

/** Exercises the FakeElement matchers. */
TestUtilsTest.prototype.fakeElementMatchers = function() {
  var grandchild = FakeUi.create('li', {'foo': 'bar'}, 'two');
  var element = FakeUi.create('div', {'id': 'a'},
      FakeUi.create('ul', {}, FakeUi.create('li', {}, 'one')),
      FakeUi.create('ol', {}, grandchild));
  element.style.visibility = 'hidden';
  expectThat(element, isElement('div', withId('a')));
  expectThat(element, not(isElement(withClass('b'))));
  expectThat(element, isElement(withAttr('id', 'a')));
  expectThat(element, isElement(withStyle('visibility', 'hidden')));
  expectThat(element, hasDescendant('li', withText('one')));
  expectEq(grandchild, expectDescendantOf(element, withAttr('foo', 'bar')));
  expectEq(grandchild, expectDescendantOf(element, withText('two')));
};

/** Tests the cm.TestBase.match function. */
TestUtilsTest.prototype.match = function() {
  function Foo(value) {
    this.value = value;
  }
  Foo.prototype.equals = function(other) {
    return this.value === other.value;
  };
  function Bar(value) {
    this.value = value;
  }

  /* Primitives */
  expectEq(true, cm.TestBase.match(null, null));
  expectEq('which !== null', cm.TestBase.match(null, undefined));
  expectEq('which !== null', cm.TestBase.match(null, ''));
  expectEq('which !== 1', cm.TestBase.match(1, null));
  expectEq('which !== 1', cm.TestBase.match(1, 2));
  expectEq('which !== 1', cm.TestBase.match(1, []));

  /* Arrays */
  expectEq('which !== []', cm.TestBase.match([], 1));
  expectEq(true, cm.TestBase.match([], []));
  expectEq(true, cm.TestBase.match([1], [1]));
  expectEq('which has length 2 (should be 3)',
           cm.TestBase.match([1, 2, 3], [1, 2]));
  expectEq('whose item [0] is 2, which !== 1', cm.TestBase.match([1], [2]));

  /* Objects */
  expectEq('whose item .a is 2, which !== 1',
           cm.TestBase.match({a: 1}, {a: 2}));
  expectEq('which lacks an expected item at .b (should be 2)',
           cm.TestBase.match({a: 1, b: 2}, {a: 1}));
  expectEq('which has an unexpected item at .b (with value 2)',
           cm.TestBase.match({a: 1}, {a: 1, b: 2}));
  expectEq('whose item .a[1].b is 2, which !== 1',
           cm.TestBase.match({a: [0, {b: 1}]}, {a: [0, {b: 2}]}));
  expectEq('whose item [\'*\'] is 2, which !== 1',
           cm.TestBase.match({'*': 1}, {'*': 2}));
  expectEq('which has class Foo (should be Bar)',
           cm.TestBase.match(new Bar('abc'), new Foo('abc')));

  /* Objects with equals() */
  expectEq(true, cm.TestBase.match(new Foo('abc'), new Bar('abc')));
  expectEq('which fails the equals() method of ' +
           gjstest.stringify(new Foo('abc')),
           cm.TestBase.match(new Foo('abc'), new Foo('def')));
  expectEq(true, cm.TestBase.match([new Foo('abc'), {x: new Foo('def')}],
                                   [new Foo('abc'), {x: new Foo('def')}]));
};

/** Tests containsExactly matcher. */
TestUtilsTest.prototype.testContainsExactly = function() {
  var pred = containsExactly('foo', 0).predicate;
  expectTrue(pred(['bar']));
  expectEq('which contains \'foo\' 1 times', pred(['foo', 'bar']));

  pred = containsExactly('foo', 2).predicate;
  expectEq('which contains \'foo\' 0 times', pred(['bar', 'baz']));
  expectEq('which contains \'foo\' 1 times', pred(['foo', 'bar']));
  expectTrue(pred(['foo', 'foo']));

  pred = containsExactly(containsRegExp(/foo/)).predicate;
  expectEq(
      'which contains an element that partially matches regex: /foo/ 0 times',
      pred(['bar']));
  expectTrue(pred(['bar', 'food']));

  pred = containsExactly(greaterThan(0)).predicate;
  expectEq(
      'which contains an element that is greater than 0 0 times', pred([0]));
  expectTrue(pred([0, 1]));
};

/** Tests cm.TestBase.createCallCapturer. */
TestUtilsTest.prototype.testCallCapturer = function() {
  var cc = cm.TestBase.createCallCapturer();
  cc('foo');
  cc('foo', 'bar');
  cc('foo', null, 'baz');

  var expectedCalls = [
    ['foo'],
    ['foo', 'bar'],
    ['foo', null, 'baz']
  ];

  expectThat(cc.calls, recursivelyEquals(expectedCalls));
};

/** Tests cm.TestBase.expectLogAction handles different sets of args. */
TestUtilsTest.prototype.testExpectLogActionArguments = function() {
  this.expectLogAction('foo', 'layer1');
  this.expectLogAction('foo', 'layer1', null, 'foo');
  this.expectLogAction('foo', 'layer1', null, 0);
  this.expectLogAction(
      containsRegExp(/bar/), isNull, null, greaterOrEqual(0));

  cm.Analytics.logAction('foo', 'layer1');
  cm.Analytics.logAction('foo', 'layer1', 'foo');
  cm.Analytics.logAction('foo', 'layer1', 0);
  cm.Analytics.logAction('foobar', null, 1);
};

/** Tests cm.TestBase.expectLogAction handles multiple calls per expectation. */
TestUtilsTest.prototype.testExpectLogActionCount = function() {
  this.expectLogAction('bar', 'layer1');
  this.expectLogAction('bar', 'layer2', 2);
  this.expectLogAction('bar', 'layer3', cm.TestBase.AT_LEAST_ONCE);

  cm.Analytics.logAction('bar', 'layer1');
  cm.Analytics.logAction('bar', 'layer2');
  cm.Analytics.logAction('bar', 'layer2');
  cm.Analytics.logAction('bar', 'layer3');
  cm.Analytics.logAction('bar', 'layer3');
};

/** Tests cm.TestBase.expectLogTime handles different sets of args. */
TestUtilsTest.prototype.testExpectLogTimeArguments = function() {
  this.expectLogTime('foo', 'var1', 1000);
  this.expectLogTime('foo', 'var1', 1000, null, 'label');
  this.expectLogTime('foo', 'var1', 1000, null, 'label', 50);
  this.expectLogTime('foo', 'var1', 1000, null, null, 50);
  this.expectLogTime(containsRegExp(/bar/), isNull, greaterOrEqual(0));

  cm.Analytics.logTime('foo', 'var1', 1000);
  cm.Analytics.logTime('foo', 'var1', 1000, 'label');
  cm.Analytics.logTime('foo', 'var1', 1000, 'label', 50);
  cm.Analytics.logTime('foo', 'var1', 1000, null, 50);
  cm.Analytics.logTime('foobar', null, 1);
};

/** Tests cm.TestBase.expectLogTime handles multiple calls per expectation. */
TestUtilsTest.prototype.testExpectLogTimeMultipleTimes = function() {
  this.expectLogTime('bar', 'var1', 1000);
  this.expectLogTime('bar', 'var2', 1000, 2);
  this.expectLogTime('bar', 'var3', 1000, cm.TestBase.AT_LEAST_ONCE);

  cm.Analytics.logTime('bar', 'var1', 1000);
  cm.Analytics.logTime('bar', 'var2', 1000);
  cm.Analytics.logTime('bar', 'var2', 1000);
  cm.Analytics.logTime('bar', 'var3', 1000);
  cm.Analytics.logTime('bar', 'var3', 1000);
};
