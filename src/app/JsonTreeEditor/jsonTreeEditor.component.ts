import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {Component, ElementRef, EventEmitter, Injectable, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import {animate, state, style, transition, trigger} from '@angular/animations';

export class TodoItem {
  key: string;
  value: string;
  isArray: boolean;
}

export class TodoItemNode {
  children: TodoItemNode[];
  item: TodoItem = {key: '', value: null, isArray: false};
}

/** Flat to-do item node with expandable and level information */
export class TodoItemFlatNode {
  item: TodoItem;
  level: number;
  expandable: boolean;
  selectConcatField = false;
}

export enum ActivityType {
  ADDED, DELETED
}

export class Activity {
  activityType: ActivityType;
  affectedItem: TodoItemNode;
  parentItem: TodoItemNode;

  constructor(activityType, affectedItem, parentItem) {
    this.activityType = activityType;
    this.affectedItem = affectedItem;
    this.parentItem = parentItem;
  }
}

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TodoItemNode[]>([]);

  get data(): TodoItemNode[] {
    return this.dataChange.value;
  }

  constructor() {
    // this.initialize();
  }

  prepareTree(input) {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = this.buildFileTree(input, 0);

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TodoItemNode`.
   */
  buildFileTree(obj: object, level: number): TodoItemNode[] {
    return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TodoItemNode();
      node.item.key = key;

      if (value != null) {
        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            node.item.isArray = true;
          }
          node.children = this.buildFileTree(value, level + 1);
        } else {
          node.item.key = key;
          node.item.value = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to to-do list */
  insertItem(parent: TodoItemNode, name: string, value: string): TodoItemNode {
    if (!parent.children) {
      parent.children = [];
    }
    const newItem = {item: {key: name, value: value}} as TodoItemNode;
    parent.children.push(newItem);
    this.dataChange.next(this.data);
    return newItem;
  }

  insertItemValue(parent: TodoItemNode, name: string, value: string): TodoItemNode {
    if (!parent.children) {
      parent.children = [];
    }
    const newItem = {item: {key: name, value: value}} as TodoItemNode;
    parent.item.value = newItem.item.key;
    this.dataChange.next(this.data);
    return newItem;
  }

  insertItemNode(parent: TodoItemNode, newItem: TodoItemNode): TodoItemNode {
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(newItem);
    this.dataChange.next(this.data);
    return newItem;
  }

  insertItemAbove(node: TodoItemNode, name: string, value: string): TodoItemNode {
    const parentNode = this.getParentFromNodes(node);
    const newItem = {item: {key: name, value: value}} as TodoItemNode;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node), 0, newItem);
    }
    this.dataChange.next(this.data);
    return newItem;
  }

  insertItemBelow(node: TodoItemNode, name: string, value: string): TodoItemNode {
    const parentNode = this.getParentFromNodes(node);
    const newItem = {item: {key: name, value: value}} as TodoItemNode;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node) + 1, 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node) + 1, 0, newItem);
    }
    this.dataChange.next(this.data);
    return newItem;
  }

  getParentFromNodes(node: TodoItemNode): TodoItemNode {
    for (let i = 0; i < this.data.length; ++i) {
      const currentRoot = this.data[i];
      const parent = this.getParent(currentRoot, node);
      if (parent != null) {
        return parent;
      }
    }
    return null;
  }

  getParent(currentRoot: TodoItemNode, node: TodoItemNode): TodoItemNode {
    if (currentRoot.children && currentRoot.children.length > 0) {
      for (let i = 0; i < currentRoot.children.length; ++i) {
        const child = currentRoot.children[i];
        if (child === node) {
          return currentRoot;
        } else if (child.children && child.children.length > 0) {
          const parent = this.getParent(child, node);
          if (parent != null) {
            return parent;
          }
        }
      }
    }
    return null;
  }

  updateItem(node: TodoItemNode, name: string) {
    node.item.key = name;
    this.dataChange.next(this.data);
  }

  deleteItem(node: TodoItemNode) {
    this.deleteNode(this.data, node);
    this.dataChange.next(this.data);
  }

  copyPasteValue(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    let newItem = new TodoItemNode();
    newItem = this.insertItemValue(to, from.item.key, from.item.value);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  copyPasteItem(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    let newItem = new TodoItemNode();
    newItem = this.insertItem(to, from.item.key, from.item.value);
    // newItem = this.insertItemValue(to, from.item.key, from.item.value);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  copyPasteItemAbove(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItemAbove(to, from.item.key, from.item.value);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  copyPasteItemBelow(from: TodoItemNode, to: TodoItemNode): TodoItemNode {
    const newItem = this.insertItemBelow(to, from.item.key, from.item.value);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  deleteNode(nodes: TodoItemNode[], nodeToDelete: TodoItemNode) {
    const index = nodes.indexOf(nodeToDelete, 0);
    if (index > -1) {
      nodes.splice(index, 1);
    } else {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          this.deleteNode(node.children, nodeToDelete);
        }
      });
    }
  }

  saveValue() {
    this.dataChange.next(this.data);
  }
}

@Component({
  selector: 'app-json-tree-editor',
  templateUrl: './jsonTreeEditor.component.html',
  styleUrls: ['./jsonTreeEditor.component.css'],
  providers: [ChecklistDatabase],
  animations: [
    trigger('openClose', [
      state('closed', style({
        transform: 'rotate(0deg)'
      })),
      state('open', style({
        transform: 'rotate(90deg)'
      })),
      transition('open => closed', [
        animate('.15s')
      ]),
      transition('closed => open', [
        animate('.15s')
      ]),
    ]),
  ]
})
export class JsonTreeEditorComponent implements OnChanges {
  @Input() inputData: object = {};
  @Input() sourceAttrs: string[];
  @Input() dragData: Map<string, string>;
  @Input() side: string;
  @Output() dragEvent = new EventEmitter();
  @Output() dropEvent = new EventEmitter();
  @Output() restructureEvent = new EventEmitter();
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  treeControl: FlatTreeControl<TodoItemFlatNode>;

  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  /* Drag and drop */
  dragNode: any;
  dragNodeExpandOverWaitTimeMs = 300;
  dragNodeExpandOverNode: any;
  dragNodeExpandOverTime: number;
  dragNodeExpandOverArea: string;
  addBaseItem = false;
  @ViewChild('emptyItem') emptyItem: ElementRef;
  showAsLabels = false;
  collapsed = true;
  copiedNode = null;
  recentActivity: Activity = null;

  constructor(private database: ChecklistDatabase, elementRef: ElementRef) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    database.prepareTree(this.inputData);
    database.dataChange.subscribe(data => {
      this.dataSource.data = [];
      this.dataSource.data = data;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!(Object.keys(changes).length === 1 && Object.keys(changes)[0] === 'dragData')) {
      let inputObj = null;
      const intmdObj = JSON.parse(JSON.stringify(this.inputData));
      if (Array.isArray(intmdObj)) {
        inputObj = {};
        this.showAsLabels = true;
        intmdObj.forEach(e => {
          inputObj[e] = null;
        });
        inputObj = JSON.stringify(inputObj);
      }
      this.database.prepareTree(intmdObj);
    }
  }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item.key === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item
      ? existingNode
      : new TodoItemFlatNode();
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.expandable = (node.children && node.children.length > 0);
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  /** Whether all the descendants of the node are selected */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return descendants.every(child => this.checklistSelection.isSelected(child));
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);
  }

  /** Select the category so we can insert the new item. */
  addNewItem(node: TodoItemFlatNode) {
    const parentNode = this.flatNodeMap.get(node);
    const childItemOperation = {item: {key: 'operation', value: null}} as TodoItemNode;
    const newItem = {item: {key: parentNode.children.length.toString(), value: null}, children: [childItemOperation]} as TodoItemNode;
    if (node.item.isArray) {
      this.database.insertItemNode(parentNode, newItem);
    } else {
      this.database.insertItem(parentNode, '', null);
    }
    this.treeControl.expand(node);
  }

  deleteItem(node: TodoItemFlatNode) {
    const parent = this.getParent(node);
    this.database.deleteNode(this.database.data, this.flatNodeMap.get(node));
    this.recentActivity = new Activity(ActivityType.DELETED, this.flatNodeMap.get(node), this.flatNodeMap.get(parent));
    this.database.dataChange.next(this.database.data);
  }

  getParent(node: TodoItemFlatNode) {
    const {treeControl} = this;
    const currentLevel = treeControl.getLevel(node);
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = treeControl.dataNodes.indexOf(node) - 1;
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = treeControl.dataNodes[i];
      if (treeControl.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
  }

  /** Save the node to database */
  saveNode(node: TodoItemFlatNode, itemValue: string) {
    const nestedNode = this.flatNodeMap.get(node);
    this.database.updateItem(nestedNode, itemValue);
  }

  insertBaseItem(name: string): TodoItemNode {
    const childItemOperation = {item: {key: 'operation', value: null}} as TodoItemNode;
    const newItem = {item: {key: name, value: null}, children: [childItemOperation]} as TodoItemNode;
    this.database.data.push(newItem);
    this.database.dataChange.next(this.database.data);
    this.addBaseItem = false;
    return newItem;
  }

  handleDragStart(event, node) {
    const map = new Map<string, string>();
    map.set('flatMap', JSON.stringify(Array.from(this.flatNodeMap)));
    map.set('dragNode', JSON.stringify(node));
    map.set('dragNodeId', this.getQualifiedId(node));
    // this.dragNode = node;
    // this.treeControl.collapse(node);
    this.dragEvent.emit(map);
  }

  handleDragOver(event, node) {
    event.preventDefault();

    // Handle node expand
    if (node === this.dragNodeExpandOverNode) {
      if (this.dragNode !== node && !this.treeControl.isExpanded(node)) {
        if ((new Date().getTime() - this.dragNodeExpandOverTime) > this.dragNodeExpandOverWaitTimeMs) {
          this.treeControl.expand(node);
        }
      }
    } else {
      this.dragNodeExpandOverNode = node;
      this.dragNodeExpandOverTime = new Date().getTime();
    }

    // Handle drag area
    const percentageX = event.offsetX / event.target.clientWidth;
    const percentageY = event.offsetY / event.target.clientHeight;
    if (percentageY < 0.25) {
      this.dragNodeExpandOverArea = 'above';
    } else if (percentageY > 0.75) {
      this.dragNodeExpandOverArea = 'below';
    } else {
      this.dragNodeExpandOverArea = 'center';
    }
  }

  handleDrop(event, node) {
    event.preventDefault();
    if (this.dragData) {
      const flatMap = this.prepareFlatMap(this.dragData.get('flatMap'));
      const extDragNode = this.toTodoItemFlatNode(JSON.parse(this.dragData.get('dragNode')));
      const extDragNodeId = this.dragData.get('dragNodeId');
      let newItem: TodoItemNode;
      newItem = this.database.copyPasteValue(this.findFromFlatMap(flatMap, extDragNode), this.flatNodeMap.get(node));
      this.dropEvent.emit('s' + extDragNodeId + '|' + 'd' + this.getQualifiedId(node));

      this.dragNode = null;
      this.dragNodeExpandOverNode = null;
      this.dragNodeExpandOverTime = 0;
    }
  }

  findFromFlatMap(map: Map<TodoItemFlatNode, TodoItemNode>, node: TodoItemFlatNode): TodoItemNode {
    let dNode: TodoItemNode = null;
    map.forEach((value, key, map1) => {
      if (key.item.key == node.item.key) {
        dNode = value;
      }
    });
    return dNode;
  }

  prepareFlatMap(obj): Map<TodoItemFlatNode, TodoItemNode> {
    const flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();
    const arr: object[] = JSON.parse(obj);
    arr.forEach(value => {
      flatNodeMap.set(this.toTodoItemFlatNode(value[0]), this.toTodoItemNode(value[1]));
    });
    return flatNodeMap;
  }

  toTodoItemFlatNode(obj): TodoItemFlatNode {
    const flatNode = new TodoItemFlatNode();
    flatNode.item = obj['item'];
    flatNode.level = obj['level'];
    flatNode.expandable = obj['expandable'];
    return flatNode;
  }

  toTodoItemNode(obj): TodoItemNode {
    const itemNode = new TodoItemNode();
    itemNode.item = obj['item'];
    itemNode.children = obj['children'];
    return itemNode;
  }

  handleDragEnd(event) {
    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }

  jsonify(obj) {
    return JSON.stringify(obj, null, 2);
  }

  translateToIAMData(data: TodoItemNode[], isArray: boolean) {
    const obj = {};
    const objArr = [];
    /*
        if (data[0] && data[0].item.key === '0') { isArray = true; }
    */
    if (isArray) {
      data.forEach(e => {
        if (e.item.value === null && e.children) {
          objArr.push(this.translateToIAMData(e.children, e.item.isArray));
        } else {
          objArr.push(e.item.value);
        }
      });
      return objArr;
    } else {
      data.forEach(e => {
        if (e.item.value === null && e.children) {
          obj[e.item.key] = this.translateToIAMData(e.children, e.item.isArray);
        } else {
          obj[e.item.key] = e.item.value;
        }
      });
      return obj;
    }
  }

  saveValue() {
    this.database.saveValue();
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.treeControl.collapseAll();
    } else {
      this.treeControl.expandAll();
    }
  }

  copyNode(node) {
    this.copiedNode = node;
  }

  pasteNode(node) {
    if (this.copiedNode) {
      let newItem: TodoItemNode;
      newItem = this.database.copyPasteItem(this.flatNodeMap.get(this.copiedNode), this.flatNodeMap.get(node));
      this.treeControl.expandDescendants(this.nestedNodeMap.get(newItem));
    }
  }

  undoRecentActivity() {
    if (this.recentActivity) {
      if (this.recentActivity.activityType === ActivityType.DELETED) {
        this.undoDelete(this.recentActivity);
      }
    }
    this.recentActivity = null;
  }

  undoDelete(activity: Activity) {
    this.database.insertItemNode(activity.parentItem, activity.affectedItem);
  }

  ignore() {
  }

  handleOperationSelection(event, node: TodoItemFlatNode) {
    if (event === 'script') {
      const childItemScript = {item: {key: 'script', value: null}} as TodoItemNode;
      const childItemScriptDestination = {item: {key: 'destination', value: null}} as TodoItemNode;
      this.flatNodeMap.get(this.getParent(node)).children.push(childItemScript, childItemScriptDestination);
      this.database.dataChange.next(this.database.data);
    }
  }

  dblClickSource(node: TodoItemFlatNode) {
    node.selectConcatField = !node.selectConcatField;
  }

  repositionLines() {
    this.restructureEvent.emit();
  }

  getQualifiedId(node) {
    return this.getParent(node) != null ? this.getQualifiedId(this.getParent(node)) + '__' + node.item.key : node.item.key;
  }

  getConnectorId(side, node) {
    return side === 'source' ? 's' + this.getQualifiedId(node) : 'd' + this.getQualifiedId(node);
  }
}



