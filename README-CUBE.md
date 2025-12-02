
# ✅ **三维场景中“模型”和“Cube”转动行为的清晰描述规范**

为了让 AI 或开发人员准确理解“模型 <--> cube 之间的联动旋转逻辑”，必须明确以下 4 个要素：

---

# **① 需要定义两个对象**

```
Object A = 模型（Model）
Object B = Cube（辅助Cube 或 Gimbal Cube）
```

---

# **② 定义坐标系与旋转空间**

必须明确旋转的空间类型，否则 AI 不知道期望的行为：

```
旋转空间：
- Local space（对象自身局部坐标）
- World space（世界坐标）
```

在提示词里可这样写：

> “所有旋转默认在对象的本地坐标系（local space）进行。”

---

# **③ 定义联动规则（最核心）**

## **规则 1：模型转动，Cube 跟随模型**

必须明确“跟随”的含义：是否完全复制、是否部分复制、是否延迟、是否反向。

AI 能理解的表达：

> 当 Object A（模型）发生任意旋转时，将其旋转值同步给 Object B（Cube）。
> 同步方式为：
> `Object B.rotation = Object A.rotation`（包括 x / y / z 全部轴向）。
> Cube 永远显示与模型一致的朝向。

对应伪代码：

```js
cube.rotation.copy(model.rotation);
```

---

## **规则 2：Cube 转动，模型跟随 Cube**

这里要特别强调：Cube 是“控制器”，模型被“驱动”。

> 当用户拖动或旋转 Object B（Cube）时，将 Cube 的旋转值作为输入，实时驱动 Object A（模型）的旋转。
> 同步方式为：
> `Object A.rotation = Object B.rotation`。

伪代码：

```js
model.rotation.copy(cube.rotation);
```

---

# **④ 关键补充（非常重要，不然 AI 会误解）**

## **需要指出“同步是双向，但需要避免循环更新”**

否则 AI 会做成 model→cube→model 无限循环。

给 AI 的清晰说明：

> 虽然两者需要互相同步，但任何一个方向的同步都必须在“当前帧中只执行一次”。
> 使用一个状态变量 `isUpdating` 避免递归或死循环。

AI 能理解的伪代码：

```js
let isUpdating = false;

function syncFromModel() {
    if (isUpdating) return;
    isUpdating = true;
    cube.rotation.copy(model.rotation);
    isUpdating = false;
}

function syncFromCube() {
    if (isUpdating) return;
    isUpdating = true;
    model.rotation.copy(cube.rotation);
    isUpdating = false;
}
```

---

# ⭐ **最终提示词模板（你可以直接发给 AI 或用于文档）**

以下是**一段完全清晰、AI 可以百分百理解的描述**：

---

**「三维场景中的联动旋转规则描述」**

1. 场景中有两个对象：

   * Object A：模型（Model）
   * Object B：Cube（用于显示或控制模型朝向）

2. 所有旋转均在对象的本地坐标系（local space）中进行。
   使用欧拉角或四元数均可，只需保持两者同步。

3. **规则 1：模型转动时，Cube 跟随模型**
   当 Object A 的 rotation 发生变化时，将其 rotation 完整复制给 Object B：

   ```
   Object_B.rotation = Object_A.rotation
   ```

4. **规则 2：Cube 转动时，模型跟随 Cube**
   当 Object B 的 rotation 发生变化时，将其 rotation 完整复制给 Object A：

   ```
   Object_A.rotation = Object_B.rotation
   ```

5. **避免循环同步**
   联动为双向，但同步必须在单向触发一次。
   使用一个状态变量避免 A→B→A 的递归循环。

---

「场景旋转行为下 Cube 的处理逻辑说明」

场景中包含一个主模型 Model，以及一个独立显示朝向的小立方体 Cube。

当用户旋转场景（通过 Camera 控制或对 Scene/Group 旋转），Cube 不应该跟着一起转。
因为 Cube 是一个独立的 UI 元素，用于显示当前视图的方向。

Cube 使用独立的相机或独立的渲染层固定在屏幕右下角。
Cube 的位置永远不随场景变化。

Cube 的旋转采用与主相机一致的 quaternion（或与模型方向同步），具体为：

Cube.quaternion.copy(Camera.quaternion);


因此：

场景旋转 → 相机方向变

Cube 的方向跟随相机

Cube 在屏幕位置不动

Model 在场景中正常被旋转