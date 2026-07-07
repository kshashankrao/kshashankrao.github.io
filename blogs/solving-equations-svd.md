# Solving Linear & Non-Linear Equations using Singular Value Decomposition (SVD)

Singular Value Decomposition (**SVD**) is one of the most versatile and powerful mathematical tools in linear algebra, computer vision, and machine learning. At its core, SVD factorizes any complex matrix into three distinct geometrical transformations: two orthogonal matrices representing **rotation**, and one diagonal matrix representing **scaling**.

$$\mathbf{A} = \mathbf{U} \mathbf{\Sigma} \mathbf{V}^T$$

Where:
* $\mathbf{U}$: Left singular vectors (an orthogonal rotation matrix in output space)
* $\mathbf{\Sigma}$: Singular values (a diagonal scaling matrix stretching along coordinate axes)
* $\mathbf{V}^T$: Right singular vectors (an orthogonal rotation matrix in input space)

Let's dissect how this single mathematical factorization provides robust solutions for both **linear regression** (solving overdetermined systems) and **non-linear geometric alignment** (3D point cloud registration via ICP).

---

## Application 1: Solving Linear Equations (Linear Regression)

When finding a hyperplane or line of best fit across noisy data, we aim to calculate the unknown slopes ($m_i$) and intercept ($c$) for a dataset.

### Problem Formulation

For a general linear equation with $k$ features across $n$ data points:

$$y = m_1 x_1 + m_2 x_2 + \dots + m_k x_k + c$$

We organize the system into matrix form:

$$\mathbf{y} = \mathbf{X} \mathbf{\beta}$$

* **The Input Matrix ($\mathbf{X}$):** An $n \times (k + 1)$ design matrix where the final column is populated entirely by $1$s to account for the bias/intercept term.
  
$$\mathbf{X} = \begin{bmatrix} x_{1,1} & \dots & x_{1,k} & 1 \\ x_{2,1} & \dots & x_{2,k} & 1 \\ \vdots & \ddots & \vdots & \vdots \\ x_{n,1} & \dots & x_{n,k} & 1 \end{bmatrix}$$

* **The Unknowns Vector ($\mathbf{\beta}$):** A $(k + 1) \times 1$ column vector holding our parameter weights.

$$\mathbf{\beta} = \begin{bmatrix} m_1 \\ m_2 \\ \vdots \\ m_k \\ c \end{bmatrix}$$

### Why Standard Inversion Fails

In real-world data, attempting standard matrix division via the normal equation $\mathbf{\beta} = (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{X}^T \mathbf{y}$ frequently leads to numerical instability. If variables are collinear or the matrix is near-singular, computing the inverse $(\mathbf{X}^T \mathbf{X})^{-1}$ causes floating-point overflow and catastrophic inaccuracies.

### The SVD Solution: Moore-Penrose Pseudoinverse

To solve this stably, we apply SVD directly to the design matrix $\mathbf{X} = \mathbf{U} \mathbf{\Sigma} \mathbf{V}^T$ and construct the **Moore-Penrose Pseudoinverse** ($\mathbf{X}^+$):

1. **Transpose the rotations:** $\mathbf{U} \to \mathbf{U}^T$ and $\mathbf{V}^T \to \mathbf{V}$.
2. **Invert the scaling matrix:** Replace every non-zero singular value $\sigma_i$ on the diagonal of $\mathbf{\Sigma}$ with its reciprocal $\frac{1}{\sigma_i}$ to form $\mathbf{\Sigma}^+$.

$$\mathbf{X}^+ = \mathbf{V} \mathbf{\Sigma}^+ \mathbf{U}^T$$

Finally, we project our target values $\mathbf{y}$ onto this pseudoinverse to extract the exact least-squares parameters:

$$\mathbf{\beta} = \mathbf{X}^+ \mathbf{y} = \mathbf{V} \mathbf{\Sigma}^+ \mathbf{U}^T \mathbf{y}$$

> **💡 Key Principle for Linear Systems:** You must **keep and invert** the scaling matrix ($\mathbf{\Sigma}$). Scaling represents the variance along each principal direction, and inverting it is essential to compute the correct slopes.

---

## Application 2: Solving Non-Linear Geometric Alignments (3D ICP)

In autonomous perception and robotics, aligning two 3D LiDAR point clouds (a **Source** cloud $\mathcal{P}$ and a **Target** cloud $\mathcal{Q}$) requires finding a rigid 6-DoF spatial transformation: a Rotation matrix $\mathbf{R} \in SO(3)$ and a Translation vector $\mathbf{t} \in \mathbb{R}^3$.

Because physical objects in real space cannot shrink or deform during motion, our optimization must enforce **strict rigid-body constraints**.

### Problem Formulation

Assume we have $N$ pairs of matched 3D points, where $\mathbf{p}_i \in \mathcal{P}$ corresponds to $\mathbf{q}_i \in \mathcal{Q}$.

First, we calculate the centroids (center of mass) of both clouds to decouple translation from rotation:

$$\mathbf{p}_c = \frac{1}{N} \sum_{i=1}^{N} \mathbf{p}_i, \quad \mathbf{q}_c = \frac{1}{N} \sum_{i=1}^{N} \mathbf{q}_i$$

Next, we construct the $3 \times 3$ **Cross-Covariance Matrix ($\mathbf{H}$)** by centering the coordinates at the origin:

$$\mathbf{H} = \sum_{i=1}^{N} (\mathbf{p}_i - \mathbf{p}_c)(\mathbf{q}_i - \mathbf{q}_c)^T$$

### The SVD Solution: Extracting Pure Rotation

Instead of factorizing the raw coordinates, we apply SVD to the cross-covariance relationship matrix $\mathbf{H}$:

$$\mathbf{H} = \mathbf{U} \mathbf{\Sigma} \mathbf{V}^T$$

Here lies the critical distinction: because we are solving for a rigid physical rotation, the point cloud **cannot stretch or shear**. Therefore, the singular value scaling matrix ($\mathbf{\Sigma}$) is **completely discarded**! We directly multiply the two orthonormal rotation bases:

$$\mathbf{R} = \mathbf{V} \mathbf{U}^T$$

*(Note: To guarantee a valid right-handed rotation without reflection, if $\det(\mathbf{R}) = -1$, we flip the sign of the 3rd column of $\mathbf{V}$ before multiplying).*

### Recovering Translation

Once the optimal rotation $\mathbf{R}$ is isolated, the translation vector $\mathbf{t}$ is straightforwardly computed by aligning the centroids:

$$\mathbf{t} = \mathbf{q}_c - \mathbf{R} \mathbf{p}_c$$

> **💡 Key Principle for Non-Linear Systems:** You must **completely discard** the scaling matrix ($\mathbf{\Sigma}$). Retaining scaling would allow the mathematical solver to stretch and deform the physical geometry.

---

## Summary Comparison

| Feature | Linear Regression ($\mathbf{y} = \mathbf{X}\mathbf{\beta}$) | 3D Point Cloud Alignment ($\mathbf{R}, \mathbf{t}$) |
| :--- | :--- | :--- |
| **Matrix Decomposed** | Raw design matrix $\mathbf{X}$ ($n \times (k+1)$) | Cross-covariance matrix $\mathbf{H}$ ($3 \times 3$) |
| **Treatment of $\mathbf{\Sigma}$ (Scale)** | **Kept and inverted** ($\mathbf{\Sigma}^+$) for division | **Discarded entirely** to enforce rigid physical isometry |
| **Recombination** | $\mathbf{X}^+ = \mathbf{V} \mathbf{\Sigma}^+ \mathbf{U}^T$ | $\mathbf{R} = \mathbf{V} \mathbf{U}^T$ |
| **Primary Engineering Goal** | Minimizing algebraic mean-squared error | Isolating 6-DoF Euclidean transformation in $SO(3)$ |

---

## 💻 Software Implementation

This algorithm is actively maintained and tested as part of my open-source computer vision and linear algebra toolkit:

> **📦 [kshashankrao / GnomieLibrary](https://github.com/kshashankrao/GnomieLibrary)**  
> 🔗 **View full module, error handling, and unit tests:** [`gnomie_library/svd_solver/svd_solver.py`](https://github.com/kshashankrao/GnomieLibrary/blob/main/src/gnomie_library/svd_solver/svd_solver.py)

```python
# Core logic extracted from GnomieLibrary (gnomie_library.SVDSolver)
import numpy as np


class SVDSolver:
    @staticmethod
    def solve_linear_regression(X: np.ndarray, y: np.ndarray, add_bias: bool = True) -> np.ndarray:
        """Solves y = X * beta stably using SVD Moore-Penrose Pseudoinverse."""
        if add_bias:
            n_samples = X.shape[0]
            X_design = np.hstack([X, np.ones((n_samples, 1))])
        else:
            X_design = X
            
        U, S, Vt = np.linalg.svd(X_design, full_matrices=False)
        tol = 1e-10 * np.max(S) if len(S) > 0 else 1e-10
        S_inv = np.where(S > tol, 1.0 / S, 0.0)
        
        return Vt.T @ np.diag(S_inv) @ U.T @ y

    @staticmethod
    def compute_icp_alignment(P: np.ndarray, Q: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Computes rigid 3D transformation (R in SO(3), t) aligning source cloud P onto Q."""
        p_centroid = np.mean(P, axis=0)
        q_centroid = np.mean(Q, axis=0)
        
        P_centered = P - p_centroid
        Q_centered = Q - q_centroid
        
        # 3x3 Cross-Covariance Matrix H
        H = P_centered.T @ Q_centered
        U, S, Vt = np.linalg.svd(H)
        
        # Extract purely rigid Rotation (discarding Sigma to enforce isometry!)
        R = Vt.T @ U.T
        
        if np.linalg.det(R) < 0:
            Vt[-1, :] *= -1
            R = Vt.T @ U.T
            
        t = q_centroid - R @ p_centroid
        return R, t
```
